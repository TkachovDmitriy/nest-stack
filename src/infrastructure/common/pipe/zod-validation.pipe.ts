import { UnprocessableEntityException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: ZodError) => {
    const formattedErrors: Record<string, string> = {};

    error.errors.forEach((err) => {
      const path = err.path.join('.');
      formattedErrors[path] = err.message;
    });

    return new UnprocessableEntityException({
      message: formattedErrors,
      options: {
        name: error.name,
      },
    });
  },
});
