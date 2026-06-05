import { UserType } from '@core/schemas/user.schema';

// Define permission groups for better organization
export enum PermissionGroup {
  LISTING = 'listing',
  PROFILE = 'profile',
  CHAT = 'chat',
  PAYMENT = 'payment',
  BOOKING = 'booking',
  ADMIN = 'admin',
}

export enum Permission {
  // Listing permissions
  CREATE_LISTING = 'create:listing',
  UPDATE_LISTING = 'update:listing',
  DELETE_LISTING = 'delete:listing',
  UPLOAD_LISTING_MEDIA = 'upload:listing:media',
  UPDATE_LISTING_STATUS = 'update:listing:status',
  VIEW_LISTING = 'view:listing',

  // Profile permissions
  UPDATE_PROFILE_FULL = 'update:profile:full',
  UPDATE_PROFILE_BASIC = 'update:profile:basic',
  VIEW_PROFILE = 'view:profile',
  UPDATE_AVATAR = 'update:avatar',

  // Chat permissions (for future implementation)
  CREATE_CHAT = 'create:chat',
  SEND_MESSAGE = 'send:message',
  VIEW_CHAT_HISTORY = 'view:chat:history',

  // Payment permissions (for future implementation)
  VIEW_PAYMENT_HISTORY = 'view:payment:history',
  CREATE_PAYMENT = 'create:payment',
  MANAGE_PAYMENT_METHODS = 'manage:payment:methods',

  // Booking permissions
  CREATE_BOOKING = 'create:booking',
  UPDATE_BOOKING = 'update:booking',
  CANCEL_BOOKING = 'cancel:booking',
  VIEW_BOOKING = 'view:booking',
  VIEW_BOOKING_CALENDAR = 'view:booking:calendar',
  UPLOAD_BOOKING_DOCUMENT = 'upload:booking:document',
  UPDATE_BOOKING_STATUS = 'update:booking:status',
  UPDATE_BOOKING_PAYOUT_STATUS = 'update:booking:payout:status',
  REQUEST_BOOKING_CANCELLATION = 'request:booking:cancellation',
  // Admin permissions (for future implementation)
  MANAGE_USERS = 'manage:users',
  VIEW_SYSTEM_STATS = 'view:system:stats',
}

// Group permissions for easier management
export const PERMISSION_GROUPS = {
  [PermissionGroup.LISTING]: [
    Permission.CREATE_LISTING,
    Permission.UPDATE_LISTING,
    Permission.DELETE_LISTING,
    Permission.UPLOAD_LISTING_MEDIA,
    Permission.UPDATE_LISTING_STATUS,
    Permission.VIEW_LISTING,
  ],
  [PermissionGroup.PROFILE]: [
    Permission.UPDATE_PROFILE_FULL,
    Permission.UPDATE_PROFILE_BASIC,
    Permission.VIEW_PROFILE,
    Permission.UPDATE_AVATAR,
  ],
  [PermissionGroup.CHAT]: [
    Permission.CREATE_CHAT,
    Permission.SEND_MESSAGE,
    Permission.VIEW_CHAT_HISTORY,
  ],
  [PermissionGroup.PAYMENT]: [
    Permission.VIEW_PAYMENT_HISTORY,
    Permission.CREATE_PAYMENT,
    Permission.MANAGE_PAYMENT_METHODS,
  ],
  [PermissionGroup.BOOKING]: [
    Permission.CREATE_BOOKING,
    Permission.UPDATE_BOOKING,
    Permission.CANCEL_BOOKING,
    Permission.VIEW_BOOKING,
    Permission.VIEW_BOOKING_CALENDAR,
    Permission.UPLOAD_BOOKING_DOCUMENT,
    Permission.UPDATE_BOOKING_STATUS,
    Permission.UPDATE_BOOKING_PAYOUT_STATUS,
    Permission.REQUEST_BOOKING_CANCELLATION,
  ],
  [PermissionGroup.ADMIN]: [Permission.MANAGE_USERS, Permission.VIEW_SYSTEM_STATS],
};

// Define role inheritance for better scalability
const BASE_USER_PERMISSIONS = [
  Permission.VIEW_PROFILE,
  Permission.UPDATE_AVATAR,
  Permission.UPDATE_PROFILE_BASIC,
  Permission.VIEW_PAYMENT_HISTORY,
  Permission.VIEW_CHAT_HISTORY,
  Permission.CREATE_CHAT,
  Permission.SEND_MESSAGE,
  Permission.CREATE_BOOKING,
  Permission.VIEW_BOOKING,
  Permission.CANCEL_BOOKING,
  Permission.UPLOAD_BOOKING_DOCUMENT,
  Permission.REQUEST_BOOKING_CANCELLATION,
  Permission.CREATE_PAYMENT,
];

const PROPERTY_MANAGER_PERMISSIONS = [
  ...BASE_USER_PERMISSIONS,
  Permission.VIEW_LISTING,
  Permission.CREATE_LISTING,
  Permission.UPDATE_LISTING,
  Permission.DELETE_LISTING,
  Permission.UPLOAD_LISTING_MEDIA,
  Permission.UPDATE_LISTING_STATUS,
  Permission.UPDATE_PROFILE_FULL,
  Permission.MANAGE_PAYMENT_METHODS,
  Permission.VIEW_BOOKING_CALENDAR,
  Permission.UPDATE_BOOKING_STATUS,
  Permission.UPDATE_BOOKING_PAYOUT_STATUS,
];

export const ROLE_PERMISSIONS = {
  [UserType.LANDLORD]: PROPERTY_MANAGER_PERMISSIONS,
  [UserType.REAL_ESTATE_AGENT]: PROPERTY_MANAGER_PERMISSIONS,
  [UserType.CUSTOMER]: BASE_USER_PERMISSIONS,
};
