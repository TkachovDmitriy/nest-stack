import { ConflictException, Injectable } from '@nestjs/common';
import { verify } from 'argon2';

import { Provider } from '@core/interfaces/auth/facebook-auth.interface';

import { PrismaService } from '@infrastructure/database/prisma.service';
import { RedisService } from '@infrastructure/redis/redis.service';

import { EmailUseCase } from '@use-cases/email/email.use-case';

@Injectable()
export class TwoFactorUseCase {
  constructor(
    private emailUseCase: EmailUseCase,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async initiateEnable(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.provider === Provider.FACEBOOK) {
      throw new ConflictException('2FA is not available for Facebook users');
    }

    if (!user) {
      throw new ConflictException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new ConflictException('2FA is already enabled');
    }

    const code = this.generateVerificationCode();

    await this.redisService.set2FACode({ userId, code, type: 'twoFactorEnable' });
    await this.emailUseCase.send2FAEnableCode(user.email, user.firstName ?? '', code);
  }

  async confirmEnable(userId: string, code: string): Promise<boolean> {
    const storedCode = await this.redisService.verify2FACode({
      userId,
      code,
      type: 'twoFactorEnable',
    });

    if (!storedCode) {
      throw new ConflictException('Invalid or expired verification code');
    }

    // Enable 2FA for the user
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });

      return true;
    } catch {
      // logger.error('Failed to enable 2FA:', error);
      throw new ConflictException('Failed to enable 2FA');
    }
  }

  async disable(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    const isMatch = await verify(user.password, password);

    if (!isMatch) throw new ConflictException('Unable to proceed. Try another password');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    });

    return true;
  }

  async send2FAAuthCode(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    const code = this.generateVerificationCode();
    await this.redisService.set2FACode({ userId, code, type: 'twoFactor' });
    await this.emailUseCase.send2FAEnableCode(user.email, user.firstName ?? '', code);

    return true;
  }

  async verify2FAAuthCode(userId: string, code: string): Promise<boolean> {
    const storedCode = await this.redisService.verify2FACode({ userId, code, type: 'twoFactor' });

    return !!storedCode;
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async resend2FAAuthCode(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    const code = this.generateVerificationCode();
    await this.redisService.set2FACode({ userId, code, type: 'twoFactorEnable' });
    await this.emailUseCase.send2FAEnableCode(user.email, user.firstName ?? '', code);
  }

  async resend2FAVerifyCode(userId: string): Promise<boolean> {
    return this.send2FAAuthCode(userId);
  }
}
