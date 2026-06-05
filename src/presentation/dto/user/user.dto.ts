import { createZodDto } from 'nestjs-zod';

import { UserCreateDtoSchema } from '@core/schemas/user.schema';

export class UserCreateRequest extends createZodDto(UserCreateDtoSchema) {}
