import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const IS_PUBLIC_WITH_USER_KEY = 'isPublicWithUser';
export const PublicWithUser = (): MethodDecorator => SetMetadata(IS_PUBLIC_WITH_USER_KEY, true);

export const IS_ADMIN_KEY = 'isAdmin';
export const Admin = (): MethodDecorator => SetMetadata(IS_ADMIN_KEY, true);

export const IS_TWO_FACTOR_VERIFY_KEY = 'isTwoFactorVerify';
export const TwoFactorVerify = (): MethodDecorator => SetMetadata(IS_TWO_FACTOR_VERIFY_KEY, true);

export const IS_REFRESH_TOKEN_KEY = 'isRefreshToken';
export const RefreshToken = (): MethodDecorator => SetMetadata(IS_REFRESH_TOKEN_KEY, true);
