import { Controller, Post, Body, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthUseCase } from '~/use-cases/auth/auth.use-case';

import { TokenPayload } from '@core/interfaces/auth/token.interface';

import {
  Confirm2FARequest,
  Disable2FARequest,
  EmailVerificationRequest,
  EmailVerificationResponse,
  LoginRequest,
  LoginResponse,
  PasswordResetCompleteRequest,
  PasswordResetInitiateRequest,
  PasswordResetResponse,
  PasswordResetVerifyRequest,
  TokensResponse,
  UpdateUserRoleRequest,
} from '@presentation/dto/auth';
import { FacebookAuthRequest } from '@presentation/dto/auth/facebook-auth.dto';
import { UserCreateRequest } from '@presentation/dto/user/user.dto';

import { TwoFactorUseCase } from '@use-cases/auth/two-factor.use-case';

import { AuthToken } from '@common/decorators/auth-token.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public, TwoFactorVerify } from '@common/decorators/public.decorator';
import { UserId } from '@common/decorators/userId.decorator';
import { RefreshTokenGuard } from '@common/guards/jwt-refresh-auth.guard';
import { RecaptchaGuard } from '@common/guards/recaptcha.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authUseCase: AuthUseCase,
    private readonly twoFactorUseCase: TwoFactorUseCase,
  ) {}

  @Public()
  @Post('signup')
  @UseGuards(RecaptchaGuard)
  @ApiOperation({ summary: 'Sign up new user' })
  @ApiResponse({
    status: 201,
    type: TokensResponse,
    description: 'User successfully created',
  })
  async signUp(@Body() createUserDto: UserCreateRequest): Promise<TokensResponse> {
    return this.authUseCase.signUp(createUserDto);
  }

  @Public()
  @Post('login')
  @UseGuards(RecaptchaGuard)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    type: LoginResponse,
    description: 'Tokens successfully refreshed',
  })
  async login(@Body() loginDto: LoginRequest): Promise<LoginResponse> {
    return this.authUseCase.login(loginDto);
  }

  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    type: LoginResponse,
    description: 'Tokens successfully refreshed',
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@AuthToken() token: string): Promise<LoginResponse> {
    return this.authUseCase.refreshTokens(token);
  }

  @Post('verify-email-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: 200,
    type: EmailVerificationResponse,
    description: 'Email successfully verified',
  })
  async verifyEmailCode(
    @CurrentUser() user: TokenPayload,
    @Body() data: EmailVerificationRequest,
  ): Promise<EmailVerificationResponse> {
    return this.authUseCase.verifyEmailCode({ code: data.code, email: user.email, id: user.sub });
  }

  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({
    status: 200,
    description: 'Verification code successfully resent',
  })
  @Post('resend-verification-code')
  async resendVerificationCode(@AuthToken() token: string): Promise<EmailVerificationResponse> {
    return this.authUseCase.resendVerificationCode(token);
  }

  @Public()
  @UseGuards(RecaptchaGuard)
  @ApiOperation({ summary: 'Initiate password reset' })
  @ApiResponse({
    status: 200,
    type: PasswordResetResponse,
    description: 'Password reset successfully initiated',
  })
  @Post('password-reset/initiate')
  async initiatePasswordReset(
    @Body() data: PasswordResetInitiateRequest,
  ): Promise<PasswordResetResponse> {
    return this.authUseCase.initiatePasswordReset(data);
  }

  @Public()
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({
    status: 200,
    type: PasswordResetResponse,
    description: 'Password reset code successfully verified',
  })
  @Post('password-reset/verify')
  async verifyResetCode(@Body() data: PasswordResetVerifyRequest): Promise<PasswordResetResponse> {
    return this.authUseCase.verifyPasswordResetCode(data);
  }

  @Public()
  @UseGuards(RecaptchaGuard)
  @ApiOperation({ summary: 'Complete password reset' })
  @ApiResponse({
    status: 200,
    type: PasswordResetResponse,
    description: 'Password reset successfully completed',
  })
  @Post('password-reset/complete')
  async completePasswordReset(
    @Body() data: PasswordResetCompleteRequest,
  ): Promise<PasswordResetResponse> {
    return this.authUseCase.completePasswordReset(data);
  }

  @Public()
  @Post('facebook')
  @ApiOperation({ summary: 'Login with Facebook' })
  @ApiResponse({
    status: 200,
    type: TokensResponse,
    description: 'Successfully authenticated with Facebook',
  })
  async facebookAuth(@Body() { accessToken }: FacebookAuthRequest): Promise<TokensResponse> {
    return this.authUseCase.facebookAuth(accessToken);
  }

  @TwoFactorVerify()
  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA enable' })
  @ApiResponse({
    status: 200,
    description: '2FA enable successfully verified',
    type: TokensResponse,
  })
  async verify2FA(
    @CurrentUser() user: TokenPayload,
    @Body() data: Confirm2FARequest,
  ): Promise<TokensResponse> {
    return this.authUseCase.verifyTwoFactor(user.sub, data.code);
  }

  @TwoFactorVerify()
  @Post('2fa/verify/resend-code')
  @ApiOperation({ summary: 'Resend 2FA verify code' })
  @ApiResponse({
    status: 200,
    description: '2FA verify code successfully resent',
  })
  async resend2FAVerifyCode(@CurrentUser() user: TokenPayload): Promise<boolean> {
    return this.twoFactorUseCase.resend2FAVerifyCode(user.sub);
  }

  @Post('2fa/resend-code')
  @ApiOperation({ summary: 'Resend 2FA enable code' })
  @ApiResponse({
    status: 200,
    description: '2FA enable code successfully resent',
  })
  async resend2FAEnableCode(@CurrentUser() user: TokenPayload): Promise<void> {
    return this.twoFactorUseCase.resend2FAAuthCode(user.sub);
  }

  @Post('2fa/enable')
  @ApiOperation({ summary: 'Initiate 2FA enable' })
  @ApiResponse({
    status: 200,
    description: '2FA enable successfully initiated',
  })
  async enable2FA(@CurrentUser() user: TokenPayload): Promise<void> {
    return this.twoFactorUseCase.initiateEnable(user.sub);
  }

  @Post('2fa/confirm')
  @ApiOperation({ summary: 'Confirm 2FA enable' })
  @ApiResponse({
    status: 200,
    description: '2FA enable successfully confirmed',
    type: TokensResponse,
  })
  async confirm2FA(
    @CurrentUser() user: TokenPayload,
    @Body() data: Confirm2FARequest,
  ): Promise<TokensResponse> {
    return this.authUseCase.confirmTwoFactor(user.sub, data.code);
  }

  @Post('2fa/disable')
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({
    status: 200,
    description: '2FA successfully disabled',
    type: TokensResponse,
  })
  async disable2FA(
    @CurrentUser() user: TokenPayload,
    @Body() data: Disable2FARequest,
  ): Promise<TokensResponse> {
    return this.authUseCase.disableTwoFactor(user.sub, data.password);
  }

  @Post('update-user-role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    type: TokensResponse,
  })
  async updateUserRole(
    @UserId() userId: string,
    @Body() data: UpdateUserRoleRequest,
  ): Promise<TokensResponse> {
    return this.authUseCase.updateUserRole(userId, data.role);
  }
}
