import { z } from 'zod';

import {
  UserSchema,
  UserCreateSchema,
  UserUpdateSchema,
  UserOutputSchema,
  UserCreateDtoSchema,
  UserProfileCompleteSchema,
} from '@core/schemas/user.schema';

export type UserEntity = z.infer<typeof UserSchema>;
export type UserOutput = z.infer<typeof UserOutputSchema>;
export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserCreateDtoInput = z.infer<typeof UserCreateDtoSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type UserProfileCompleteInput = z.infer<typeof UserProfileCompleteSchema>;
