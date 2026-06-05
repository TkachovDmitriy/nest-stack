import { Injectable } from '@nestjs/common';

import {
  UserCreateInput,
  UserEntity,
  UserOutput,
  UserUpdateInput,
} from '@core/interfaces/user/user.interface';
import { UserOutputSchema, UserSchema, UserUpdateSchema } from '@core/schemas/user.schema';
import { SlugGenerator } from '@core/utils/slug-generator.util';

import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<UserOutput> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return UserOutputSchema.parse(user);
  }

  async findByEmail(email: string): Promise<UserOutput> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { email } });
    return UserOutputSchema.parse(user);
  }

  async create(data: UserCreateInput): Promise<UserOutput> {
    const { confirmPassword, ...createUserData } = data;
    const user = await this.prisma.user.create({ data: createUserData });
    return UserOutputSchema.parse(user);
  }

  async update(id: string, data: UserUpdateInput): Promise<UserOutput> {
    const updateUserData = UserUpdateSchema.parse(data);
    const slugData = await this.generateSlugForUser(id, updateUserData);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserData,
        ...(slugData && { slug: slugData.slug, slugId: slugData.slugId }),
      },
    });

    return UserOutputSchema.parse(user);
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { email } });
    return UserSchema.parse(user);
  }

  async findByIdWithPassword(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    return UserSchema.parse(user);
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken, lastLoginAt: refreshToken ? new Date() : undefined },
    });
  }

  private shouldRegenerateSlug(data: UserUpdateInput): boolean {
    return !!(
      data.firstName !== undefined ||
      data.lastName !== undefined ||
      data.companyName !== undefined
    );
  }

  private async generateSlugForUser(
    userId: string,
    updateData: UserUpdateInput,
  ): Promise<{ slug: string; slugId: string } | null> {
    if (!this.shouldRegenerateSlug(updateData)) return null;

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, companyName: true, slugId: true },
    });

    if (!currentUser) return null;

    const firstName =
      updateData.firstName !== undefined ? updateData.firstName : currentUser.firstName;
    const lastName =
      updateData.lastName !== undefined ? updateData.lastName : currentUser.lastName;
    const companyName =
      updateData.companyName !== undefined ? updateData.companyName : currentUser.companyName;

    return SlugGenerator.generateUserSlugFromData(
      firstName,
      lastName,
      companyName,
      15,
      currentUser.slugId || undefined,
    );
  }
}
