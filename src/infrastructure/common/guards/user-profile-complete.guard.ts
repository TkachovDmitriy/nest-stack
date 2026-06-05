import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

import { TokenPayload } from '@core/interfaces/auth/token.interface';
import { UserProfileCompleteInput } from '@core/interfaces/user/user.interface';
import { UserProfileCompleteSchema, UserType } from '@core/schemas/user.schema';

import { PrismaService } from '@infrastructure/database/prisma.service';
import { LoggerService } from '@infrastructure/logger/logger-service';

@Injectable()
export class UserProfileCompleteGuard implements CanActivate {
  private readonly logger = new LoggerService(UserProfileCompleteGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const user = request.user as TokenPayload;

      if (!user?.sub) {
        throw new ForbiddenException('User not authenticated');
      }

      const userProfile = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,
          userType: true,
          isEmailVerified: true,
          licenseId: true,
          companyName: true,
          facebookLink: true,
        },
      });

      const parsedUserProfile = UserProfileCompleteSchema.parse(userProfile);

      if (!userProfile) {
        throw new ForbiddenException('User profile not found');
      }

      if (!userProfile.isEmailVerified) {
        throw new ForbiddenException('Please verify your email before creating a listing');
      }

      // Check for required fields based on user type
      const missingFields = this.getMissingRequiredFields(parsedUserProfile);

      if (missingFields.length > 0) {
        throw new ForbiddenException(
          `Please complete your profile. Missing fields: ${missingFields.join(', ')}`,
        );
      }

      return true;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private getMissingRequiredFields(profile: UserProfileCompleteInput): string[] {
    const missingFields: string[] = [];

    // Basic required fields for all users
    if (!profile.firstName) missingFields.push('First Name');
    if (!profile.lastName) missingFields.push('Last Name');
    if (!profile.phoneNumber) missingFields.push('Phone Number');
    if (!profile.userType) missingFields.push('User Type');

    // Additional fields based on user type
    if (profile.userType === UserType.REAL_ESTATE_AGENT) {
      if (!profile.licenseId) missingFields.push('License ID');
      if (!profile.companyName) missingFields.push('Company Name');
    }

    return missingFields;
  }
}
