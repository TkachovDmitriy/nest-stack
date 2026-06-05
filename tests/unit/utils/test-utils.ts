import { randomUUID } from 'crypto';

import {
  EntityType,
  ListingStatus,
  ListingStep,
  PropertyType,
  BookingStatus,
  PaymentMethod,
  PayoutStatus,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Provider } from '@core/interfaces/auth/facebook-auth.interface';
import { UserType } from '@core/schemas/user.schema';

// Test Constants
export const TEST_DATE = new Date('2024-01-01T00:00:00.000Z');

// Prisma Error Codes
export const PrismaErrorCode = {
  NOT_FOUND: 'P2025',
  UNIQUE_CONSTRAINT: 'P2002',
} as const;

// Test Factories
export const createMockUser = (overrides = {}) => ({
  id: randomUUID(),
  email: 'test123@example.com',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '1234567890',
  password: 'hashedPassword123',
  confirmPassword: 'hashedPassword123',
  lastLoginAt: null,
  birthDate: new Date('1990-01-01'),
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  isEmailVerified: false,
  refreshToken: null,
  provider: Provider.LOCAL,
  providerId: null,
  licenseId: null,
  userType: UserType.LANDLORD,
  companyName: 'Company Name',
  facebookLink: 'https://www.facebook.com/company',
  avatar: 'https://www.avatar.com/avatar.png',
  twoFactorEnabled: false,
  storefrontDescription: 'Storefront Description',
  storefrontBanner: 'https://www.storefrontbanner.com/banner.png',
  slug: 'test-user',
  slugId: 'test-user-123',
  bankName: 'Test Bank',
  bankAccountNumber: '1234567890',
  gcashNumber: '09123456789',
  ...overrides,
});

export const createMockListing = (overrides = {}) => ({
  id: randomUUID(),
  userId: randomUUID(),
  currentStep: ListingStep.BASIC_INFO,
  status: ListingStatus.DRAFT,
  entityType: EntityType.BUY,
  propertyType: PropertyType.APARTMENT,
  isFeatured: false,
  isPublished: false,
  attributes: [],
  attachments: [],
  location: null,
  user: null,
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

export const createMockWishlist = (overrides = {}) => ({
  id: randomUUID(),
  userId: randomUUID(),
  listingId: randomUUID(),
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: randomUUID(),
  userId: randomUUID(),
  ownerId: randomUUID(),
  listingId: randomUUID(),
  paymentMethod: PaymentMethod.PAYMONGO,
  passportOrIdUrl: 'https://example.com/passport.pdf',
  price: 1000,
  checkInDate: new Date('2024-02-01'),
  checkOutDate: new Date('2024-02-05'),
  guests: 2,
  pets: 0,
  status: BookingStatus.PENDING_PAYMENT,
  payoutStatus: PayoutStatus.PENDING,
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

export const createMockChatRoom = (overrides = {}) => ({
  id: randomUUID(),
  listingId: randomUUID(),
  participants: [randomUUID(), randomUUID()],
  archived: false,
  lastMessageAt: TEST_DATE,
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

export const createMockChatMessage = (overrides = {}) => ({
  id: randomUUID(),
  chatRoomId: randomUUID(),
  senderId: randomUUID(),
  content: 'Test message content',
  readBy: [randomUUID()],
  metadata: null,
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

// Expected Response Factories
export const createExpectedListing = (overrides = {}) => ({
  id: randomUUID(),
  userId: randomUUID(),
  currentStep: ListingStep.BASIC_INFO,
  status: ListingStatus.ACTIVE,
  entityType: EntityType.BUY,
  propertyType: PropertyType.APARTMENT,
  isFeatured: true,
  isPublished: true,
  attributes: [],
  attachments: [],
  location: {
    id: randomUUID(),
    city: 'Test City',
    country: 'Test Country',
    state: 'Test State',
    latitude: 0,
    longitude: 0,
    postalCode: '12345',
    address: 'Test Address',
  },
  user: createMockUser(),
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

export const createExpectedWishlistResponse = (overrides = {}) => ({
  id: randomUUID(),
  userId: randomUUID(),
  listingId: randomUUID(),
  listing: {
    id: randomUUID(),
    isFeatured: false,
    entityType: EntityType.BUY,
    propertyType: PropertyType.APARTMENT,
    status: ListingStatus.ACTIVE,
    isPublished: true,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
  },
  user: {
    id: randomUUID(),
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  },
  location: {
    id: randomUUID(),
    city: 'Test City',
    country: 'Test Country',
  },
  attachments: [],
  attributes: {},
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

export const createExpectedBookingResponse = (overrides = {}) => ({
  id: randomUUID(),
  userId: randomUUID(),
  ownerId: randomUUID(),
  listingId: randomUUID(),
  paymentMethod: PaymentMethod.PAYMONGO,
  passportOrIdUrl: 'https://example.com/passport.pdf',
  price: 1000,
  checkInDate: new Date('2024-02-01'),
  checkOutDate: new Date('2024-02-05'),
  guests: 2,
  pets: 0,
  status: BookingStatus.PENDING_PAYMENT,
  payoutStatus: PayoutStatus.PENDING,
  paymentId: 'payment_123',
  commissionId: randomUUID(),
  listing: {
    listing: {
      id: randomUUID(),
      isFeatured: false,
      entityType: EntityType.BUY,
      propertyType: PropertyType.APARTMENT,
      leaseDuration: null,
      status: ListingStatus.ACTIVE,
      isPublished: true,
      slug: 'test-listing',
      slugId: 'test-listing-123',
      allowCashPayment: true,
      requirePassportOrId: true,
      createdAt: TEST_DATE,
      updatedAt: TEST_DATE,
    },
    location: {
      id: randomUUID(),
      city: 'Test City',
      country: 'Test Country',
      state: 'Test State',
      street: 'Test Street',
      latitude: 0,
      longitude: 0,
      postalCode: '12345',
      address: 'Test Address',
    },
    attachments: [],
    attributes: {},
    user: {
      id: randomUUID(),
      email: 'owner@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '1234567890',
      avatar: 'https://example.com/avatar.jpg',
      companyName: 'Test Company',
      facebookLink: 'https://facebook.com/test',
      licenseId: 'LIC123',
      userType: 'LANDLORD',
      slug: 'jane-smith',
      slugId: 'jane-smith-123',
      gcashNumber: '09123456789',
    },
    isFavorite: false,
  },
  user: {
    id: randomUUID(),
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '1234567890',
    avatar: 'https://example.com/avatar.jpg',
    companyName: 'Test Company',
    facebookLink: 'https://facebook.com/test',
    licenseId: 'LIC123',
    userType: 'CUSTOMER',
    slug: 'john-doe',
    slugId: 'john-doe-123',
    gcashNumber: '09123456789',
  },
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

export const createExpectedChatRoomResponse = (overrides = {}) => ({
  id: randomUUID(),
  listingId: randomUUID(),
  participants: [randomUUID(), randomUUID()],
  archived: false,
  lastMessageAt: TEST_DATE,
  lastMessage: {
    id: randomUUID(),
    chatRoomId: randomUUID(),
    senderId: randomUUID(),
    content: 'Test message',
    readBy: [randomUUID()],
    metadata: null,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    sender: {
      id: randomUUID(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg',
      companyName: 'Test Company',
    },
  },
  messages: [],
  unreadCount: 0,
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

export const createExpectedChatMessageResponse = (overrides = {}) => ({
  id: randomUUID(),
  chatRoomId: randomUUID(),
  senderId: randomUUID(),
  content: 'Test message content',
  readBy: [randomUUID()],
  metadata: null,
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  sender: {
    id: randomUUID(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    companyName: 'Test Company',
  },
  ...overrides,
});

// Pagination Response Factories
export const createPaginatedResponse = <T>(
  data: T[],
  total = data.length,
  page = 1,
  limit = 10,
) => ({
  data,
  meta: {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit,
  },
});

// Error Helpers
export const createPrismaError = (
  code: (typeof PrismaErrorCode)[keyof typeof PrismaErrorCode] = PrismaErrorCode.NOT_FOUND,
  message = 'Record not found',
  meta?: Record<string, unknown>,
) => {
  return new PrismaClientKnownRequestError(message, {
    code,
    clientVersion: '5.x.x',
    meta: meta || {
      cause: 'Record to update not found.',
    },
  });
};

// Mock Service Factories
export const createMockPrismaService = () => {
  const mockService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    listing: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    wishlist: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    commission: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chatRoom: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    attributeDefinition: {
      findMany: jest.fn(),
    },
    attributeValue: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      if (typeof callback === 'function') {
        return callback(mockService);
      }
      return Promise.resolve();
    }),
    $queryRaw: jest.fn(),
  };
  return mockService;
};

export const createMockAppSearchService = () => ({
  updateListing: jest.fn(),
  bulkUpdateListings: jest.fn(),
});

export const createMockAttributeService = () => ({
  getStepAttributes: jest.fn(),
  validateAndFormatAttributes: jest.fn(),
});

export const createMockQueryBuilder = () => ({
  buildFindByStatusQuery: jest.fn(),
  buildFindByIdQuery: jest.fn(),
  buildCreateQuery: jest.fn(),
  buildUpdateQuery: jest.fn(),
  buildDeleteQuery: jest.fn(),
});

export const createMockBookingQueryBuilder = () => ({
  buildBookingByIdQuery: jest.fn(),
  buildUserBookingsQuery: jest.fn(),
  buildUserBookingsCountQuery: jest.fn(),
  buildLandlordBookingsQuery: jest.fn(),
  buildLandlordBookingsCountQuery: jest.fn(),
  buildUserBookingsByDateFilterQuery: jest.fn(),
  buildLandlordBookingsByDateFilterQuery: jest.fn(),
});

// Mock Types
export type MockPrismaService = ReturnType<typeof createMockPrismaService>;
export type MockAppSearchService = ReturnType<typeof createMockAppSearchService>;
export type MockAttributeService = ReturnType<typeof createMockAttributeService>;
export type MockListingQueryBuilder = ReturnType<typeof createMockQueryBuilder>;
export type MockBookingQueryBuilder = ReturnType<typeof createMockBookingQueryBuilder>;

export type MockSearchService = {
  indexListing: jest.Mock;
  updateListing: jest.Mock;
  removeListing: jest.Mock;
  bulkUpdateListings: jest.Mock;
  bulkIndexListings: jest.Mock;
  searchListings: jest.Mock;
};

export const createMockSearchService = (): MockSearchService => ({
  indexListing: jest.fn(),
  updateListing: jest.fn(),
  removeListing: jest.fn(),
  bulkUpdateListings: jest.fn(),
  bulkIndexListings: jest.fn(),
  searchListings: jest.fn(),
});
