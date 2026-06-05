import { ForbiddenException } from '@nestjs/common';

export class RefreshTokenMalformedException extends ForbiddenException {
  constructor() {
    super('Refresh token malformed');
  }
}
