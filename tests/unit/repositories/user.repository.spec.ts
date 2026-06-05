import { randomUUID } from 'crypto';

import { Test, TestingModule } from '@nestjs/testing';
import { ListingStatus, ListingStep, EntityType, PropertyType } from '@prisma/client';
import { ZodError } from 'zod';

import { UserOutputSchema, UserType, UserUpdateSchema } from '@core/schemas/user.schema';

import { PrismaService } from '@infrastructure/database/prisma.service';
import { UserRepository } from '@infrastructure/repositories/user.repository';

import {
  createMockUser,
  createPrismaError,
  PrismaErrorCode,
  createMockPrismaService,
  createMockSearchService,
  MockPrismaService,
  MockSearchService,
} from '../utils/test-utils';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prismaService: MockPrismaService;
  let searchService: MockSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useFactory: () => {
            const mockService = createMockPrismaService();
            prismaService = mockService;
            return mockService;
          },
        },
        {
          provide: 'SearchService',
          useFactory: () => {
            const mockService = createMockSearchService();
            searchService = mockService;
            return mockService;
          },
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('error handling', () => {
      it('should throw ConflictException when email exists', async () => {
        const createUserDto = createMockUser();

        const prismaError = createPrismaError(
          PrismaErrorCode.UNIQUE_CONSTRAINT,
          'Unique constraint failed on the fields: (`email`)',
          { target: ['email'] },
        );

        prismaService.user.create.mockRejectedValueOnce(prismaError);

        await expect(repository.create(createUserDto)).rejects.toThrow(
          'Unique constraint failed on the fields: (`email`)',
        );
        expect(prismaService.user.create).toHaveBeenCalledTimes(1);
        expect(prismaService.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            email: createUserDto.email,
          }),
        });
      });

      it('should throw ZodError for invalid email format', async () => {
        const invalidUserDto = {
          ...createMockUser(),
          email: 'invalid-email',
        };

        await expect(repository.create(invalidUserDto)).rejects.toThrow(ZodError);
        expect(prismaService.user.create).toHaveBeenCalledTimes(1);
      });
    });

    describe('successful creation', () => {
      it('should create a user with valid data', async () => {
        const createUserDto = createMockUser();
        const createdUser = createMockUser(createUserDto);

        prismaService.user.create.mockResolvedValueOnce(createdUser);

        const result = await repository.create(createUserDto);

        expect(result).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            email: createUserDto.email,
          }),
        );
      });
    });
  });

  describe('findByEmail', () => {
    const nonExistentEmail = 'nonexistent@example.com';

    it('should return null for non-existent email', async () => {
      prismaService.user.findUniqueOrThrow.mockRejectedValueOnce(createPrismaError());

      let result;
      try {
        result = await repository.findByEmail(nonExistentEmail);
      } catch (_e) {
        result = null;
      }

      expect(result).toBeNull();
      expect(prismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { email: nonExistentEmail },
      });
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return complete user data including password', async () => {
      const mockUser = createMockUser();
      prismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      const result = await repository.findByEmailWithPassword(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(result.password).toBeDefined();
    });
  });

  describe('findByIdWithPassword', () => {
    it('should return user with password when found', async () => {
      const mockUser = createMockUser();
      prismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      const result = await repository.findByIdWithPassword(mockUser.id);

      expect(prismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      const mockUser = createMockUser();

      prismaService.user.findUniqueOrThrow.mockRejectedValueOnce(createPrismaError());

      await expect(repository.findByIdWithPassword(mockUser.id)).rejects.toThrow(
        'Record not found',
      );
    });
  });

  describe('update', () => {
    const userId = randomUUID();

    describe('when changing user type to CUSTOMER', () => {
      it('should deactivate active listings and update Elasticsearch', async () => {
        const updateUserDto = UserUpdateSchema.parse({ userType: UserType.CUSTOMER });
        const mockUpdatedUser = createMockUser({ ...updateUserDto, userType: UserType.CUSTOMER });
        const mockActiveListings = [
          {
            id: randomUUID(),
            userId: randomUUID(),
            status: ListingStatus.ACTIVE,
            currentStep: ListingStep.BASIC_INFO,
            entityType: EntityType.BUY,
            propertyType: PropertyType.APARTMENT,
            isPublished: false,
            isFeatured: false,
            attributes: [],
            attachments: [],
            location: null,
            user: mockUpdatedUser,
          },
        ];

        prismaService.user.findUnique.mockResolvedValue(mockUpdatedUser);
        prismaService.user.update.mockResolvedValue(mockUpdatedUser);
        prismaService.listing.findMany.mockResolvedValue(mockActiveListings);
        prismaService.listing.updateMany.mockResolvedValue({ count: 1 });
        searchService.bulkUpdateListings.mockResolvedValue(undefined);

        const result = await repository.update(userId, updateUserDto);

        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: updateUserDto,
        });
        expect(prismaService.listing.findMany).toHaveBeenCalledWith({
          where: {
            userId,
            status: ListingStatus.ACTIVE,
          },
          include: {
            attributes: {
              include: {
                definition: true,
              },
            },
            attachments: true,
            location: true,
            user: true,
          },
        });
        expect(prismaService.listing.updateMany).toHaveBeenCalledWith({
          where: {
            id: {
              in: [mockActiveListings[0].id],
            },
          },
          data: {
            status: ListingStatus.INACTIVE,
            updatedAt: expect.any(Date),
          },
        });
        expect(searchService.bulkUpdateListings).toHaveBeenCalledWith(expect.any(Array));
        expect(result).toEqual({
          id: mockUpdatedUser.id,
          email: mockUpdatedUser.email,
          firstName: mockUpdatedUser.firstName,
          lastName: mockUpdatedUser.lastName,
          phoneNumber: mockUpdatedUser.phoneNumber,
          lastLoginAt: mockUpdatedUser.lastLoginAt,
          birthDate: mockUpdatedUser.birthDate,
          createdAt: mockUpdatedUser.createdAt,
          provider: mockUpdatedUser.provider,
          providerId: mockUpdatedUser.providerId,
          updatedAt: mockUpdatedUser.updatedAt,
          isEmailVerified: mockUpdatedUser.isEmailVerified,
          licenseId: mockUpdatedUser.licenseId,
          userType: mockUpdatedUser.userType,
          companyName: mockUpdatedUser.companyName,
          bankName: mockUpdatedUser.bankName,
          bankAccountNumber: mockUpdatedUser.bankAccountNumber,
          gcashNumber: mockUpdatedUser.gcashNumber,
          facebookLink: mockUpdatedUser.facebookLink,
          avatar: mockUpdatedUser.avatar,
          twoFactorEnabled: mockUpdatedUser.twoFactorEnabled,
          storefrontDescription: mockUpdatedUser.storefrontDescription,
          storefrontBanner: mockUpdatedUser.storefrontBanner,
          slug: mockUpdatedUser.slug,
          slugId: mockUpdatedUser.slugId,
        });
      });

      it('should handle case when no active listings exist', async () => {
        const updateUserDto = UserUpdateSchema.parse({ userType: UserType.CUSTOMER });
        const mockUpdatedUser = createMockUser({ ...updateUserDto, userType: UserType.CUSTOMER });

        prismaService.user.findUnique.mockResolvedValue(mockUpdatedUser);
        prismaService.user.update.mockResolvedValue(mockUpdatedUser);
        prismaService.listing.findMany.mockResolvedValue([]);

        const result = await repository.update(userId, updateUserDto);

        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: updateUserDto,
        });
        expect(prismaService.listing.findMany).toHaveBeenCalled();
        expect(prismaService.listing.updateMany).not.toHaveBeenCalled();
        expect(searchService.bulkUpdateListings).not.toHaveBeenCalled();
        expect(result).toEqual({
          id: mockUpdatedUser.id,
          email: mockUpdatedUser.email,
          firstName: mockUpdatedUser.firstName,
          lastName: mockUpdatedUser.lastName,
          phoneNumber: mockUpdatedUser.phoneNumber,
          lastLoginAt: mockUpdatedUser.lastLoginAt,
          birthDate: mockUpdatedUser.birthDate,
          createdAt: mockUpdatedUser.createdAt,
          provider: mockUpdatedUser.provider,
          providerId: mockUpdatedUser.providerId,
          updatedAt: mockUpdatedUser.updatedAt,
          isEmailVerified: mockUpdatedUser.isEmailVerified,
          licenseId: mockUpdatedUser.licenseId,
          userType: mockUpdatedUser.userType,
          companyName: mockUpdatedUser.companyName,
          bankName: mockUpdatedUser.bankName,
          bankAccountNumber: mockUpdatedUser.bankAccountNumber,
          gcashNumber: mockUpdatedUser.gcashNumber,
          facebookLink: mockUpdatedUser.facebookLink,
          avatar: mockUpdatedUser.avatar,
          twoFactorEnabled: mockUpdatedUser.twoFactorEnabled,
          storefrontDescription: mockUpdatedUser.storefrontDescription,
          storefrontBanner: mockUpdatedUser.storefrontBanner,
          slug: mockUpdatedUser.slug,
          slugId: mockUpdatedUser.slugId,
        });
      });
    });

    describe('successful updates', () => {
      it('should update user with valid partial data', async () => {
        const updateUserDto = UserUpdateSchema.parse({
          firstName: 'Updated',
          lastName: 'Name',
          phoneNumber: '9876543210',
        });
        const mockUpdatedUser = createMockUser(updateUserDto);

        prismaService.user.update.mockResolvedValue(mockUpdatedUser);

        const result = await repository.update(userId, updateUserDto);

        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: updateUserDto,
        });
        expect(UserOutputSchema.parse(result)).toBeDefined();
      });

      it('should handle partial updates', async () => {
        const partialUpdate = UserUpdateSchema.parse({ firstName: 'Updated' });
        const mockUpdatedUser = createMockUser(partialUpdate);

        prismaService.user.update.mockResolvedValue(mockUpdatedUser);

        await repository.update(userId, partialUpdate);

        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: partialUpdate,
        });
      });
    });

    describe('error handling', () => {
      it('should throw error when user not found', async () => {
        const updateUserDto = UserUpdateSchema.parse({
          firstName: 'Updated',
          lastName: 'Name',
        });
        prismaService.user.update.mockRejectedValueOnce(createPrismaError());

        await expect(repository.update(userId, updateUserDto)).rejects.toThrow('Record not found');
      });
    });
  });

  describe('updateRefreshToken', () => {
    const userId = randomUUID();
    const refreshToken = 'new-refresh-token';

    it('should update refresh token', async () => {
      prismaService.user.update.mockResolvedValue(createMockUser());

      await repository.updateRefreshToken(userId, refreshToken);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken, lastLoginAt: expect.any(Date) },
      });
    });

    it('should clear refresh token when null', async () => {
      prismaService.user.update.mockResolvedValue(createMockUser());

      await repository.updateRefreshToken(userId, null);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: null },
      });
    });

    it('should throw error when user not found', async () => {
      prismaService.user.update.mockRejectedValueOnce(createPrismaError());

      await expect(repository.updateRefreshToken(userId, 'token')).rejects.toThrow(
        'Record not found',
      );
    });
  });

  describe('schema validation integration', () => {
    it('should validate response data against UserResponseSchema', async () => {
      const mockUser = createMockUser();

      prismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      const result = await repository.findByEmail(mockUser.email);

      expect(prismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        phoneNumber: mockUser.phoneNumber,
        lastLoginAt: mockUser.lastLoginAt,
        birthDate: mockUser.birthDate,
        createdAt: mockUser.createdAt,
        provider: mockUser.provider,
        providerId: mockUser.providerId,
        updatedAt: mockUser.updatedAt,
        isEmailVerified: mockUser.isEmailVerified,
        licenseId: mockUser.licenseId,
        userType: mockUser.userType,
        companyName: mockUser.companyName,
        bankName: mockUser.bankName,
        bankAccountNumber: mockUser.bankAccountNumber,
        gcashNumber: mockUser.gcashNumber,
        facebookLink: mockUser.facebookLink,
        avatar: mockUser.avatar,
        twoFactorEnabled: mockUser.twoFactorEnabled,
        storefrontDescription: mockUser.storefrontDescription,
        storefrontBanner: mockUser.storefrontBanner,
        slug: mockUser.slug,
        slugId: mockUser.slugId,
      });

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');

      const validationResult = UserOutputSchema.safeParse(result);
      expect(validationResult.success).toBe(true);
    });
  });
});
