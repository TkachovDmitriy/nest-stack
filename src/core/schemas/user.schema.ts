import { z } from 'zod';

import { Provider } from '@core/interfaces/auth/facebook-auth.interface';

import { IdSchema } from '@infrastructure/common/schemas/id.schema';

// Add avatar validation schema
const AvatarSchema = z.object({
  avatar: z.string().url().nullable().describe('Profile photo URL'),
});

// Add storefront banner validation schema
const StorefrontBannerSchema = z.object({
  storefrontBanner: z.string().url().nullable().describe('Storefront banner URL'),
});

// Add UserType enum for better type safety
export enum UserType {
  LANDLORD = 'landlord',
  REAL_ESTATE_AGENT = 'real_estate_agent',
  CUSTOMER = 'customer',
}

export const UserSchema = z.object({
  id: IdSchema,
  email: z.string().email().default('test@example.com').describe('Email'),
  firstName: z.string().default('Test').describe('First name').nullable(),
  lastName: z.string().default('User').describe('Last name').nullable(),
  lastLoginAt: z.date().nullable().describe('Last login at'),
  birthDate: z.coerce.date().nullable().describe('Birth date'),
  phoneNumber: z.string().describe('Phone number'),
  createdAt: z.date(),
  updatedAt: z.date(),
  isEmailVerified: z.boolean().default(false),
  licenseId: z.string().nullable(),
  userType: z.nativeEnum(UserType).nullable(),
  companyName: z.string().nullable(),
  facebookLink: z.string().nullable(),
  storefrontDescription: z.string().nullable().describe('Storefront description'),
  slug: z.string().nullable().describe('User slug'),
  slugId: z.string().nullable().describe('User slug ID'),

  password: z.string().min(6).describe('Password'),
  confirmPassword: z.string().min(6).describe('Confirm password').optional(),
  refreshToken: z.string().nullable(),

  twoFactorEnabled: z.boolean().default(false),
  // twoFactorSecret: z.string().nullable(),
  // twoFactorVerified: z.boolean(),

  // Banking details for payouts
  bankName: z.string().nullable().describe('Bank name for payouts'),
  bankAccountNumber: z.string().nullable().describe('Bank account number for payouts'),
  gcashNumber: z.string().nullable().describe('GCash number for payouts'),

  provider: z.nativeEnum(Provider).default(Provider.LOCAL),
  providerId: z.string().nullable(),

  // Add avatar fields
  ...AvatarSchema.shape,
  // Add storefront banner fields
  ...StorefrontBannerSchema.shape,
});

export const UserOutputSchema = UserSchema.omit({
  password: true,
  confirmPassword: true,
  refreshToken: true,
});

export const UserWithDetectionActiveListingsOutputSchema = UserOutputSchema.extend({
  hasActiveListings: z.boolean(),
});

export const UserPublicOutputSchema = UserSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  companyName: true,
  storefrontBanner: true,
  storefrontDescription: true,
  facebookLink: true,
  avatar: true,
  email: true,
  userType: true,
  slug: true,
  slugId: true,
  licenseId: true,
});

export const UserProfileCompleteSchema = UserSchema.pick({
  firstName: true,
  lastName: true,
  phoneNumber: true,
  userType: true,
  licenseId: true,
  companyName: true,
  facebookLink: true,
  isEmailVerified: true,
});

export const UserCreateSchema = UserSchema.pick({
  provider: true,
  providerId: true,
  email: true,
  password: true,
  phoneNumber: true,
  confirmPassword: true,
  isEmailVerified: true,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const UserCreateDtoSchema = UserSchema.pick({
  email: true,
  password: true,
  phoneNumber: true,
  confirmPassword: true,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const UserUpdateSchema = UserSchema.omit({
  refreshToken: true,
  createdAt: true,
  email: true,
}).partial();

export const UserBasicProfileUpdateSchema = UserSchema.pick({
  firstName: true,
  lastName: true,
  phoneNumber: true,
  userType: true,
  facebookLink: true,
  avatar: true,
  birthDate: true,
}).partial();

export const UserBankingDetailsUpdateSchema = UserSchema.pick({
  bankName: true,
  bankAccountNumber: true,
  gcashNumber: true,
}).partial();

export const UserSocialAuthSchema = UserSchema.pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
}).extend({
  picture: z.string().nullable(),
});

export const UserInitiateAvatarUploadSchema = z.object({
  contentType: z.string(),
});

// Create storefront banner upload schema
export const UserInitiateStorefrontBannerUploadSchema = z.object({
  contentType: z.string(),
});

// Create avatar-specific schemas
export const UserAvatarUpdateSchema = AvatarSchema.extend({
  id: IdSchema,
});

export const UserAvatarResponseSchema = z.object({
  avatar: z.string().url().nullable(),
  avatarKey: z.string().nullable(),
});

// Create storefront banner-specific schemas
export const UserStorefrontBannerUpdateSchema = StorefrontBannerSchema.extend({
  id: IdSchema,
});

export const UserStorefrontBannerResponseSchema = z.object({
  storefrontBanner: z.string().url().nullable(),
  storefrontBannerKey: z.string().nullable(),
});

export const UserStorefrontBannerUploadSchema = z.object({
  storefrontBannerKey: z.string().nullable(),
});

export const UsersSitemapOutputSchema = z.object({
  pages: z.number(),
  total: z.number(),
  users: z.array(z.object({ id: z.string(), slug: z.string().nullable() })).optional(),
});
