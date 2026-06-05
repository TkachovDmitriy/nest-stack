import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jose from 'jose';

import { AdminTokenPayload } from '@core/interfaces/auth/admin-token.interface';
import { AdminTokenPayloadSchema } from '@core/schemas/auth.schema';

import { PrismaService } from '@infrastructure/database/prisma.service';
import { LoggerService } from '@infrastructure/logger/logger-service';
import { RedisService } from '@infrastructure/redis/redis.service';

@Injectable()
export class AdminTokenService {
  private readonly logger = new LoggerService(AdminTokenService.name);
  private jwsKeysPromise: Promise<jose.GenerateKeyPairResult> | null = null;
  private readonly ADMIN_JWS_KEYS_NAME = 'admin_jws';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
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
      const storedKeys = await this.redisService.getAuthKeys(this.ADMIN_JWS_KEYS_NAME);

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
        this.ADMIN_JWS_KEYS_NAME,
        JSON.stringify({
          privateKey: privateKeyPem,
          publicKey: publicKeyPem,
        }),
      );

      return keys;
    } catch (error) {
      this.logger.error('Error loading or generating Admin JWS keys:', error);
      throw new ConflictException('Failed to load or generate Admin JWS keys');
    }
  }

  //   async createTokens(adminId: string, email: string): Promise<AdminTokensOutput> {
  //     const [accessToken, refreshToken] = await Promise.all([
  //       this.createToken(adminId, email, '1d'),
  //       this.createToken(adminId, email, '7d'),
  //     ]);

  //     const hashedRefreshToken = await hash(refreshToken);
  //     await this.adminUseCase.refreshTokens(adminId, hashedRefreshToken);

  //     return { accessToken, refreshToken };
  //   }

  async createToken(adminId: string, email: string, expiresIn: string): Promise<string> {
    const { privateKey: jwsPrivateKey } = await this.getJwsKeys();
    const now = Math.floor(Date.now() / 1000);
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });

    const payload: AdminTokenPayload = {
      sub: adminId,
      email,
      role: 'admin',
      name: admin?.name ?? '',
      iat: now,
      exp: this.calculateExpirationTime(expiresIn),
      jti: crypto.randomUUID(),
      tokenVersion: 1,
    };

    try {
      const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256' })
        .sign(jwsPrivateKey);

      return jwt;
    } catch (error) {
      this.logger.error('Error creating admin token:', error);
      throw new ConflictException('Admin token creation failed');
    }
  }

  async verifyToken(token: string): Promise<AdminTokenPayload> {
    const { publicKey: jwsPublicKey } = await this.getJwsKeys();

    try {
      const { payload } = await jose.jwtVerify(token, jwsPublicKey);
      const validatedPayload = AdminTokenPayloadSchema.parse(payload);

      //   if (isRefresh) {
      //     await this.validateRefreshToken(validatedPayload.sub, token);
      //   }

      this.validateTokenClaims(validatedPayload);

      return validatedPayload;
    } catch (error) {
      this.logger.error('Admin token verification failed:', error);
      throw new UnauthorizedException('Admin token verification failed');
    }
  }

  //   private async validateRefreshToken(adminId: string, token: string): Promise<void> {
  //     const admin = await this.adminUseCase.findByIdWithPassword(adminId);

  //     if (!admin) {
  //       throw new UnauthorizedException('Admin not found');
  //     }

  //     if (!admin.refreshToken) {
  //       throw new UnauthorizedException('Refresh token not found');
  //     }

  //     const isValidToken = await verify(admin.refreshToken, token).catch(() => false);

  //     if (!isValidToken) {
  //       throw new UnauthorizedException('Invalid admin refresh token');
  //     }
  //   }

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

  private validateTokenClaims(payload: AdminTokenPayload): void {
    const now = Math.floor(Date.now() / 1000);
    const clockSkewTolerance = 60;

    if (!payload.sub || !payload.email || !payload.jti || payload.role !== 'admin') {
      throw new UnauthorizedException('Missing required admin token claims');
    }

    if (!payload.exp) {
      throw new UnauthorizedException('Token expiration is required');
    }
    if (payload.exp <= now - clockSkewTolerance) {
      throw new UnauthorizedException('Token has expired');
    }

    if (!payload.iat) {
      throw new UnauthorizedException('Token issue time is required');
    }
    if (payload.iat > now + clockSkewTolerance) {
      throw new UnauthorizedException('Token issued in the future');
    }

    const maxTokenAge = 7 * 24 * 60 * 60;
    if (now - payload.iat > maxTokenAge) {
      throw new UnauthorizedException('Token has exceeded maximum allowed age');
    }
  }
}
