import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { TokenPayload } from '@core/interfaces/auth/token.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
