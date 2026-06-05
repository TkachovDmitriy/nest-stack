import { Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from '@infrastructure/database/prisma.module';
import { RecaptchaService } from '@infrastructure/recaptcha/recaptcha.service';
import { RedisService } from '@infrastructure/redis/redis.service';

import { PermissionService } from '@auth/permission.service';
import { routePermissionsConfig } from '@auth/router/route-permissions.config';
import { RoutePermissionsRegistry } from '@auth/router/route-permissions.registry';
import { SocialAuthService } from '@auth/social-auth.service';
import { TokenService } from '@auth/token.service';

import { RouterPermissionsGuard } from '@common/guards/router-permissions.guard';

import { AuthUseCase } from './auth.use-case';
import { TwoFactorUseCase } from './two-factor.use-case';

import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, EmailModule, UserModule],
  providers: [
    AuthUseCase,
    RecaptchaService,
    SocialAuthService,
    TwoFactorUseCase,
    RedisService,
    PermissionService,
    TokenService,
    RoutePermissionsRegistry,
    // Use the merged router permissions guard for authentication and permissions
    {
      provide: APP_GUARD,
      useClass: RouterPermissionsGuard,
    },
  ],
  exports: [
    AuthUseCase,
    PermissionService,
    RecaptchaService,
    SocialAuthService,
    TwoFactorUseCase,
    TokenService,
    RoutePermissionsRegistry,
  ],
})
export class AuthModule implements OnModuleInit {
  constructor(private routePermissionsRegistry: RoutePermissionsRegistry) {}

  /**
   * Initialize the module by registering all route permissions
   */
  onModuleInit() {
    // Register all route permissions from the configuration
    this.routePermissionsRegistry.registerMany(routePermissionsConfig);
  }
}
