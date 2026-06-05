import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { TwoFactorCode, TwoFactorCodeType } from '@core/types/2fa.types';
import { EmailCode, EmailCodeType } from '@core/types/email.types';

import { redisConfig } from '@infrastructure/configs/redis.config';
import { LoggerService } from '@infrastructure/logger/logger-service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new LoggerService(RedisService.name);
  private readonly CODE_PREFIXES = {
    email: 'email:verification:',
    password: 'password:reset:',
    twoFactor: '2fa:verification:',
    twoFactorEnable: '2fa:enable:',
    auth: 'auth:keys:',
  } as const;

  constructor() {
    this.redis = new Redis(redisConfig.url, {
      maxRetriesPerRequest: redisConfig.retryAttempts,
      retryStrategy: (times: number) => {
        if (times > redisConfig.retryAttempts) {
          return null;
        }
        return Math.min(times * redisConfig.retryDelay, 2000);
      },
      enableReadyCheck: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.info('Redis client connected');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis client error:', error);
    });

    this.redis.on('ready', () => {
      this.logger.info('Redis client ready');
    });
  }

  private getKey(type: EmailCodeType | TwoFactorCodeType, email: string): string {
    return `${this.CODE_PREFIXES[type]}${email}`;
  }

  async save(data: EmailCode): Promise<void> {
    const key = this.getKey(data.type, data.email);
    await this.redis.set(key, data.code, 'EX', redisConfig.ttl);
  }

  async verify({ code, email, type }: EmailCode): Promise<boolean> {
    const key = this.getKey(type, email);
    const storedCode = await this.redis.get(key);

    if (storedCode === code) {
      await this.delete(type, email);
      return true;
    }
    return false;
  }

  async delete(type: EmailCodeType, email: string): Promise<void> {
    const key = this.getKey(type, email);
    await this.redis.del(key);
    this.logger.debug(`${type} code deleted for email: ${email}`);
  }

  async ping(): Promise<string> {
    return await this.redis.ping();
  }

  async set2FACode({ userId, code, type }: TwoFactorCode): Promise<void> {
    const key = this.getKey(type, userId);
    await this.redis.set(key, code, 'EX', redisConfig.ttl);
  }

  async verify2FACode({ userId, code, type }: TwoFactorCode): Promise<boolean> {
    const key = this.getKey(type, userId);
    const storedCode = await this.redis.get(key);

    if (storedCode === code) {
      await this.delete2FACode({ userId, type, code });
      return true;
    }

    return false;
  }

  async delete2FACode({ userId, type }: TwoFactorCode): Promise<void> {
    const key = this.getKey(type, userId);
    await this.redis.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.info('Redis connection closed');
  }

  // Auth keys management methods
  async getAuthKeys(keyName: string): Promise<string | null> {
    const key = `${this.CODE_PREFIXES.auth}${keyName}`;
    return await this.redis.get(key);
  }

  async setAuthKeys(keyName: string, value: string, ttlInDays = 15): Promise<void> {
    const key = `${this.CODE_PREFIXES.auth}${keyName}`;
    const ttlInSeconds = ttlInDays * 24 * 60 * 60; // 15 days
    await this.redis.setex(key, ttlInSeconds, value);
    this.logger.debug(`Auth keys stored: ${keyName}`);
  }

  async deleteAuthKeys(keyName: string): Promise<void> {
    const key = `${this.CODE_PREFIXES.auth}${keyName}`;
    await this.redis.del(key);
    this.logger.debug(`Auth keys deleted: ${keyName}`);
  }
}
