import { createZodDto } from 'nestjs-zod';

import {
  AdminLoginSchema,
  Confirm2FASchema,
  Disable2FASchema,
  LoginSchema,
  TokensSchema,
  UpdateUserRoleSchema,
} from '@core/schemas/auth.schema';

export class LoginRequest extends createZodDto(LoginSchema) {}
export class LoginResponse extends createZodDto(TokensSchema) {}
export class AdminLoginRequest extends createZodDto(AdminLoginSchema) {}
export class AdminLoginResponse extends createZodDto(TokensSchema.omit({ refreshToken: true })) {}

export class Confirm2FARequest extends createZodDto(Confirm2FASchema) {}
export class Disable2FARequest extends createZodDto(Disable2FASchema) {}

export class UpdateUserRoleRequest extends createZodDto(UpdateUserRoleSchema) {}
