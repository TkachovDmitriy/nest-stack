import { BadRequestException } from '@nestjs/common';

export class DateAlreadyExistsException extends BadRequestException {
  constructor() {
    super({
      statusCode: 400,
      message: 'Date already exists',
      error: 'Bad Request',
    });
  }
}
