import { ConflictException, Injectable, BadRequestException } from '@nestjs/common';
import { hash } from 'argon2';

import {
  UserCreateInput,
  UserEntity,
  UserOutput,
  UserUpdateInput,
} from '@core/interfaces/user/user.interface';

import { UserRepository } from '@infrastructure/repositories/user.repository';

@Injectable()
export class UserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(data: UserCreateInput): Promise<UserOutput> {
    try {
      if (data.password !== data.confirmPassword) {
        throw new BadRequestException("Passwords don't match");
      }

      const hashedPassword = await hash(data.password);
      return this.userRepository.create({ ...data, password: hashedPassword });
    } catch (_error) {
      throw new ConflictException('Unable to proceed. Try another email or reset your password');
    }
  }

  async findById(id: string): Promise<UserOutput> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<UserOutput> {
    return this.userRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity> {
    return this.userRepository.findByEmailWithPassword(email);
  }

  async findByIdWithPassword(id: string): Promise<UserEntity> {
    return this.userRepository.findByIdWithPassword(id);
  }

  async updateUser(id: string, data: UserUpdateInput): Promise<UserOutput> {
    return this.userRepository.update(id, data);
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    return this.userRepository.updateRefreshToken(id, refreshToken);
  }

  async isProfileComplete(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return !!user.firstName && !!user.lastName && !!user.phoneNumber && user.isEmailVerified;
  }
}
