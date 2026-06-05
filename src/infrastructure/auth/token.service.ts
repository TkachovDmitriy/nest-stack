import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, verify } from 'argon2';
import * as jose from 'jose';

import { UserUseCase } from '~/use-cases/user/user.use-case';

import { TokenPayload, TokensOutput } from '@core/interfaces/auth/token.interface';
import { TokenPayloadSchema } from '@core/schemas/auth.schema';

import { LoggerService } from '@infrastructure/logger/logger-service';
import { RedisService } from '@infrastructure/redis/redis.service';

@Injectable()
export class TokenService {
  private readonly logger = new LoggerService(TokenService.name);
  private jwsKeysPromise: Promise<jose.GenerateKeyPairResult> | null = null;
  private readonly JWS_KEYS_NAME = 'user_jws';

  constructor(
    private userUseCase: UserUseCase,
    private redisService: RedisService,
  ) {}

  private async getJwsKeys(): Promise<jose.GenerateKeyPairResult> {
    if (!this.jwsKeysPromise) {
      this.jwsKeysPromise = this.loadOrGenerateKeys();
    }
    return this.jwsKeysPromise;
  }

  private async loadOrGenerateKeys(): Promise<jose.GenerateKeyPairResult> {
    try {
      // Try to load keys from Redis
      const storedKeys = await this.redisService.getAuthKeys(this.JWS_KEYS_NAME);

      if (storedKeys) {
        const { privateKey, publicKey } = JSON.parse(storedKeys);
        return {
          privateKey: await jose.importPKCS8(privateKey, 'RS256'),
          publicKey: await jose.importSPKI(publicKey, 'RS256'),
        };
      }

      // Generate new keys if not found in Redis
      const keys = await jose.generateKeyPair('RS256', {
        modulusLength: 2048,
        extractable: true,
      });

      // Store keys in Redis
      const privateKeyPem = await jose.exportPKCS8(keys.privateKey);
      const publicKeyPem = await jose.exportSPKI(keys.publicKey);

      await this.redisService.setAuthKeys(
        this.JWS_KEYS_NAME,
        JSON.stringify({
          privateKey: privateKeyPem,
          publicKey: publicKeyPem,
        }),
      );

      return keys;
    } catch (error) {
      this.logger.error('Error loading or generating JWS keys:', error);
      throw new ConflictException('Failed to load or generate JWS keys');
    }
  }

  // **** Use it only if need encryption for jws ****
  // private async getJweKeys(): Promise<jose.GenerateKeyPairResult> {
  //   return jose.generateKeyPair('RSA-OAEP-256', {
  //     modulusLength: 2048,
  //     extractable: true,
  //   });
  // }

  async createTokens(
    userId: string,
    email: string,
    isEmailVerified = false,
    mfaVerified = false,
  ): Promise<TokensOutput> {
    const [accessToken, refreshToken] = await Promise.all([
      this.createToken(userId, email, isEmailVerified, '1d', mfaVerified),
      this.createToken(userId, email, isEmailVerified, '7d', mfaVerified),
    ]);

    const hashedRefreshToken = await hash(refreshToken);
    await this.userUseCase.updateRefreshToken(userId, hashedRefreshToken);

    return { accessToken, refreshToken };
  }

  private async createToken(
    userId: string,
    email: string,
    isEmailVerified = false,
    expiresIn: string,
    mfaVerified = false,
  ): Promise<string> {
    const { privateKey: jwsPrivateKey } = await this.getJwsKeys();
    const now = Math.floor(Date.now() / 1000);
    const user = await this.userUseCase.findById(userId);

    const payload: TokenPayload = {
      sub: userId,
      email,
      avatar: user?.avatar ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      twoFactorEnabled: user?.twoFactorEnabled ?? false,
      twoFactorVerified: mfaVerified,
      iat: now,
      exp: this.calculateExpirationTime(expiresIn),
      jti: crypto.randomUUID(),
      tokenVersion: 1,
      isEmailVerified: isEmailVerified,
      userType: user?.userType ?? '',
      provider: user?.provider ?? '',
    };

    try {
      // Sign the payload with JWS
      const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256' })
        .sign(jwsPrivateKey);

      // **** Use it only if need encryption for jws ****
      // Encrypt the signed token
      // const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(jwt))
      //   .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      //   .encrypt(this.jwePublicKey);

      return jwt;
    } catch (error) {
      this.logger.error('Error creating token:', error);
      throw new ConflictException('Token creation failed');
    }
  }

  async verifyToken(token: string, isRefresh = false, requireMfa = false): Promise<TokenPayload> {
    const { publicKey: jwsPublicKey } = await this.getJwsKeys();

    try {
      // **** Use it only if need encryption for jws ****
      // Decrypt the JWE token
      // const { plaintext } = await jose.compactDecrypt(token, this.jwePrivateKey);
      // const jwt = new TextDecoder().decode(plaintext);

      // Verify the JWS signature using the public key
      const { payload } = await jose.jwtVerify(token, jwsPublicKey);
      const validatedPayload = TokenPayloadSchema.parse(payload);

      if (isRefresh) {
        await this.validateRefreshToken(validatedPayload.sub, token);
      }

      // Verify user still exists in database
      try {
        const user = await this.userUseCase.findById(validatedPayload.sub);
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
      } catch (userError) {
        this.logger.error('User lookup failed during token verification:', userError);
        throw new UnauthorizedException('User not found');
      }

      this.validateTokenClaims(validatedPayload, requireMfa);

      return validatedPayload;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new UnauthorizedException('Token verification failed');
    }
  }

  private async validateRefreshToken(userId: string, token: string): Promise<void> {
    const user = await this.userUseCase.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isValidToken = await verify(user.refreshToken, token).catch(() => false);

    if (!isValidToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private calculateExpirationTime(expiresIn: string): number {
    const SECONDS_PER_DAY = 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);

    const durationMap: Record<string, number> = {
      '1d': SECONDS_PER_DAY,
      '7d': 7 * SECONDS_PER_DAY,
    };

    const duration = durationMap[expiresIn];
    if (!duration) {
      throw new Error(`Invalid expiration time: ${expiresIn}`);
    }

    return now + duration;
  }

  private validateTokenClaims(payload: TokenPayload, requireMfa = false): void {
    const now = Math.floor(Date.now() / 1000);
    const clockSkewTolerance = 60; // 1 minute tolerance for clock skew

    // Check required fields
    if (!payload.sub || !payload.email || !payload.jti) {
      throw new UnauthorizedException('Missing required token claims');
    }

    // Expiration time check (exp)
    if (!payload.exp) {
      throw new UnauthorizedException('Token expiration is required');
    }
    if (payload.exp <= now - clockSkewTolerance) {
      throw new UnauthorizedException('Token has expired');
    }

    // Issued at time check (iat)
    if (!payload.iat) {
      throw new UnauthorizedException('Token issue time is required');
    }
    // Token can't be used before it was issued (with clock skew tolerance)
    if (payload.iat > now + clockSkewTolerance) {
      throw new UnauthorizedException('Token issued in the future');
    }

    if (requireMfa && !payload.mfaVerified) {
      throw new UnauthorizedException('MFA verification required');
    }

    // Optional: Maximum token age check
    const maxTokenAge = 7 * 24 * 60 * 60; // 7 days
    if (now - payload.iat > maxTokenAge) {
      throw new UnauthorizedException('Token has exceeded maximum allowed age');
    }
  }

  async createPasswordResetToken(email: string): Promise<string> {
    try {
      const { privateKey: jwsPrivateKey } = await this.getJwsKeys();
      const now = Math.floor(Date.now() / 1000);

      const payload = {
        email,
        type: 'password_reset',
        iat: now,
        exp: now + 900, // 15 minutes
        jti: crypto.randomUUID(),
      };

      // Sign the payload with JWS
      const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256' })
        .sign(jwsPrivateKey);

      return token;
    } catch (error) {
      this.logger.error('Error creating password reset token:', error);
      throw new ConflictException('Failed to create password reset token');
    }
  }

  async verifyPasswordResetToken(token: string): Promise<{ email: string }> {
    const { publicKey: jwsPublicKey } = await this.getJwsKeys();

    try {
      // Verify the JWS signature using the public key
      const { payload } = await jose.jwtVerify(token, jwsPublicKey);

      // Type guard and validation
      if (
        typeof payload !== 'object' ||
        !payload.email ||
        !payload.type ||
        !payload.jti ||
        payload.type !== 'password_reset'
      ) {
        throw new UnauthorizedException('Invalid reset token format');
      }

      return { email: payload.email as string };
    } catch (error) {
      this.logger.error('Password reset token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
