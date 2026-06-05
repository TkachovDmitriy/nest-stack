import { randomBytes } from 'crypto';

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { verify, hash } from 'argon2';

import {
  EmailVerificationInput,
  EmailVerificationOutput,
  EmailVerificationSuccessOutput,
  LoginInput,
  PasswordResetCompleteInput,
  PasswordResetInitiateInput,
  PasswordResetVerifyInput,
} from '@core/interfaces/auth/auth.interface';
import { Provider } from '@core/interfaces/auth/facebook-auth.interface';
import { TokensOutput } from '@core/interfaces/auth/token.interface';
import { UserCreateDtoInput, UserEntity } from '@core/interfaces/user/user.interface';
import { UserType } from '@core/schemas/user.schema';

import { LoggerService } from '@infrastructure/logger/logger-service';

import { SocialAuthService } from '@auth/social-auth.service';
import { TokenService } from '@auth/token.service';

import { TwoFactorUseCase } from './two-factor.use-case';

import { EmailUseCase } from '../email/email.use-case';
import { UserUseCase } from '../user/user.use-case';

@Injectable()
export class AuthUseCase {
  private readonly logger = new LoggerService(AuthUseCase.name);

  constructor(
    private tokenService: TokenService,
    private userUseCase: UserUseCase,
    private emailUseCase: EmailUseCase,
    private socialAuthService: SocialAuthService,
    private twoFactorUseCase: TwoFactorUseCase,
  ) {}

  async signUp(data: UserCreateDtoInput): Promise<TokensOutput> {
    // @TODO: Fix this mock for email verification
    const existingUser = await this.userUseCase.findByEmail(data.email).catch(() => null);

    if (existingUser) {
      if (existingUser.provider === Provider.FACEBOOK) {
        throw new BadRequestException(
          'Unable to proceed. Try another email or reset your password',
        );
      }
      throw new BadRequestException('Unable to proceed. Try another email or reset your password');
    }

    // Create user with local provider
    const user = await this.userUseCase.createUser({
      ...data,
      provider: Provider.LOCAL,
      providerId: null,
      isEmailVerified: false,
    });

    // Generate tokens immediately after user creation
    const tokens = await this.tokenService.createTokens(user.id, user.email, false);

    // Send confirmation email
    await this.emailUseCase.sendVerificationEmail(user.email);

    this.logger.info('New user signed up:', {
      userId: user.id,
      email: user.email.slice(0, 3) + '***',
    });

    return tokens;
  }

  async login({ email, password }: LoginInput): Promise<TokensOutput> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new ConflictException('Unable to proceed. Try another email or reset your password');
    }

    if (user.twoFactorEnabled) {
      // Generate and send 2FA code
      await this.twoFactorUseCase.send2FAAuthCode(user.id);

      // Return partial token
      const tokens = await this.tokenService.createTokens(
        user.id,
        user.email,
        user.isEmailVerified,
        false,
      );

      return tokens;
    }

    // Return full access if 2FA not enabled
    const tokens = await this.tokenService.createTokens(
      user.id,
      user.email,
      user.isEmailVerified,
      false,
    );

    return tokens;
  }

  async verifyTwoFactor(userId: string, code: string): Promise<TokensOutput> {
    const isValid = await this.twoFactorUseCase.verify2FAAuthCode(userId, code);

    if (!isValid) {
      throw new ConflictException('Invalid 2FA code');
    }

    const user = await this.userUseCase.findById(userId);

    if (!user) {
      throw new ConflictException('User not found');
    }

    const tokens = await this.tokenService.createTokens(
      user.id,
      user.email,
      user.isEmailVerified,
      true,
    );

    return tokens;
  }

  async confirmTwoFactor(userId: string, code: string): Promise<TokensOutput> {
    const user = await this.userUseCase.findById(userId);

    if (!user) {
      throw new ConflictException('User not found');
    }

    const isValid = await this.twoFactorUseCase.confirmEnable(userId, code);

    if (!isValid) {
      throw new ConflictException('Invalid 2FA code');
    }

    const tokens = await this.tokenService.createTokens(
      userId,
      user.email,
      user.isEmailVerified,
      true,
    );

    return tokens;
  }

  async disableTwoFactor(userId: string, password: string): Promise<TokensOutput> {
    const user = await this.userUseCase.findById(userId);

    if (!user) {
      throw new ConflictException('User not found');
    }

    const isDisabled = await this.twoFactorUseCase.disable(userId, password);

    if (!isDisabled) {
      throw new ConflictException('Failed to disable two factor');
    }

    const tokens = await this.tokenService.createTokens(
      userId,
      user.email,
      user.isEmailVerified,
      false,
    );

    return tokens;
  }

  async refreshTokens(refreshToken: string): Promise<TokensOutput> {
    const payload = await this.tokenService.verifyToken(refreshToken, true);
    const mfaEnabled = payload.twoFactorEnabled && payload.twoFactorVerified;

    return this.tokenService.createTokens(
      payload.sub,
      payload.email,
      payload.isEmailVerified,
      mfaEnabled,
    );
  }

  async verifyEmailCode(
    data: EmailVerificationInput,
  ): Promise<EmailVerificationSuccessOutput | EmailVerificationOutput> {
    const verified = await this.emailUseCase.verifyEmailCode(data.email, data.code);

    if (!verified) {
      return {
        success: false,
        message: 'Invalid or expired verification token',
      };
    }

    // Generate new tokens with updated email verification status
    const newTokens = await this.tokenService.createTokens(data.id, data.email, true);

    return {
      success: true,
      message: 'Email verified successfully',
      tokens: newTokens, // Include new tokens with updated verification status
    };
  }

  async updateUserRole(userId: string, role: UserType): Promise<TokensOutput> {
    const user = await this.userUseCase.findById(userId);

    if (!user) {
      throw new ConflictException('User not found');
    }

    // Update the user type instead of role since there's no role field
    // The userType field is available in the UserSchema and must be a valid UserType enum value
    const updatedUser = await this.userUseCase.updateUser(userId, {
      userType: role,
      updatedAt: new Date(),
    });

    // Generate new tokens with updated user information
    const tokens = await this.tokenService.createTokens(
      updatedUser.id,
      updatedUser.email,
      updatedUser.isEmailVerified,
      updatedUser.twoFactorEnabled,
    );

    this.logger.info(`User role updated for user: ${userId}`, {
      userId,
      newRole: role,
    });

    return tokens;
  }

  async resendVerificationCode(token: string): Promise<EmailVerificationOutput> {
    try {
      // Verify and decode the access token
      const payload = await this.tokenService.verifyToken(token, false);
      const email = payload.email;

      // Check if email is already verified
      const user = await this.userUseCase.findByEmail(email);
      if (user.isEmailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      // Generate new verification code
      await this.emailUseCase.sendVerificationEmail(email);

      return {
        success: true,
        message: 'Verification code resent successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to resend verification code');
    }
  }

  async initiatePasswordReset(data: PasswordResetInitiateInput): Promise<EmailVerificationOutput> {
    const user = await this.userUseCase.findByEmail(data.email);

    if (!user) {
      return {
        success: true,
        message: 'If your email is registered, you will receive a reset code',
      };
    }

    if (user.provider === Provider.FACEBOOK) {
      throw new ConflictException('Unable to proceed. Try another email');
    }

    const name = `${user.firstName} ${user.lastName}` || 'User';
    await this.emailUseCase.sendPasswordResetEmail(data.email, name);

    return {
      success: true,
      message: 'If your email is registered, you will receive a reset code',
    };
  }

  async verifyPasswordResetCode({
    email,
    code,
  }: PasswordResetVerifyInput): Promise<EmailVerificationOutput> {
    try {
      const verified = await this.emailUseCase.verifyPasswordResetCode(email, code);

      if (!verified) {
        return {
          success: false,
          message: 'Invalid or expired reset code',
        };
      }

      // Generate a temporary reset token after successful verification
      const resetToken = await this.tokenService.createPasswordResetToken(email);

      return {
        success: true,
        message: 'Reset code verified successfully',
        resetToken,
      };
    } catch (error) {
      throw new BadRequestException('Failed to verify reset code');
    }
  }

  async completePasswordReset({
    resetToken,
    newPassword,
    confirmPassword,
  }: PasswordResetCompleteInput): Promise<EmailVerificationOutput> {
    try {
      if (newPassword !== confirmPassword) {
        throw new BadRequestException("Passwords don't match");
      }

      // Verify the reset token and get the email
      const { email } = await this.tokenService.verifyPasswordResetToken(resetToken);

      const user = await this.userUseCase.findByEmail(email);
      if (!user) {
        throw new BadRequestException(
          'Unable to proceed. Try another email or reset your password',
        );
      }

      const hashedPassword = await hash(newPassword);
      await this.userUseCase.updateUser(user.id, {
        password: hashedPassword,
        updatedAt: new Date(),
      });

      return {
        success: true,
        message: 'Password updated successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to update password');
    }
  }

  private async validateUser(email: string, password: string): Promise<UserEntity> {
    try {
      const user = await this.userUseCase.findByEmailWithPassword(email);

      if (!user)
        throw new ConflictException('Unable to proceed. Try another email or reset your password');

      const isMatch = await verify(user.password, password);

      if (!isMatch)
        throw new ConflictException('Unable to proceed. Try another email or reset your password');

      return user;
    } catch (error) {
      throw new ConflictException('Unable to proceed. Try another email or reset your password');
    }
  }

  async facebookAuth(accessToken: string): Promise<TokensOutput> {
    try {
      const facebookUser = await this.socialAuthService.verifyFacebookToken(accessToken);
      const existingUser = await this.userUseCase.findByEmail(facebookUser.email).catch(() => null);

      if (!!existingUser) {
        if (existingUser.provider === Provider.FACEBOOK) {
          return this.tokenService.createTokens(existingUser.id, existingUser.email, true);
        }

        throw new BadRequestException(
          'Facebook authentication failed: Please login with your email and password.',
        );
      }

      const password = randomBytes(32).toString('hex');

      const newUser = await this.userUseCase.createUser({
        email: facebookUser.email,
        provider: Provider.FACEBOOK,
        providerId: facebookUser.id,
        isEmailVerified: true,
        password: password,
        confirmPassword: password,
        phoneNumber: '',
      });

      this.logger.info('New user created via Facebook:', {
        userId: newUser.id,
        email: newUser.email.slice(0, 3) + '***',
      });

      return this.tokenService.createTokens(newUser.id, newUser.email, true);
    } catch (error) {
      throw new UnauthorizedException(
        'Unable to proceed. Try another email or reset your password',
      );
    }
  }
}
