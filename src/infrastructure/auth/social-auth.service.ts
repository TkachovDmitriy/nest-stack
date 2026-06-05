import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';

import { UserSocialAuthOutput } from '@core/interfaces/auth/facebook-auth.interface';

import { LoggerService } from '@infrastructure/logger/logger-service';

@Injectable()
export class SocialAuthService {
  private readonly logger = new LoggerService(SocialAuthService.name);

  constructor() {}

  async verifyFacebookToken(accessToken: string): Promise<UserSocialAuthOutput> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${accessToken}`,
      ).then((res) => res.json());

      if (!response.email) {
        throw new BadRequestException('Email is required from Facebook account');
      }

      return {
        id: response.id,
        email: response.email,
        firstName: response.first_name,
        lastName: response.last_name,
        picture: response.picture?.data?.url,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Facebook token');
    }
  }
}
