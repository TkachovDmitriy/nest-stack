import { Module } from '@nestjs/common';

import { PrismaModule } from '@infrastructure/database/prisma.module';
import { UserRepository } from '@infrastructure/repositories/user.repository';

import { UserUseCase } from './user.use-case';

@Module({
  imports: [PrismaModule],
  providers: [UserUseCase, UserRepository],
  exports: [UserUseCase],
})
export class UserModule {}
