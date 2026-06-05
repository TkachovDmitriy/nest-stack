import { Test, TestingModule } from '@nestjs/testing';
import { EntityType } from '@prisma/client';

import { UserRepository } from '@infrastructure/repositories/user.repository';

import { UserUseCase } from '@use-cases/user/user.use-case';

describe('UserUseCase - Profile Validation', () => {
  let userUseCase: UserUseCase;
  let userRepository: UserRepository;

  const mockUserRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserUseCase,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    userUseCase = module.get<UserUseCase>(UserUseCase);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isProfileComplete', () => {
    it('should return true for complete profile', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        userType: 'landlord',
        isEmailVerified: true,
        facebookLink: 'https://facebook.com/johndoe',
        licenseId: null,
        companyName: null,
        bankName: null,
        bankAccountNumber: null,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userUseCase.isProfileComplete('user-id');

      expect(result).toBe(true);
    });

    it('should return false for incomplete profile', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: null,
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        userType: 'landlord',
        isEmailVerified: true,
        facebookLink: 'https://facebook.com/johndoe',
        licenseId: null,
        companyName: null,
        bankName: null,
        bankAccountNumber: null,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userUseCase.isProfileComplete('user-id');

      expect(result).toBe(false);
    });

    it('should return false for unverified email', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        userType: 'landlord',
        isEmailVerified: false,
        facebookLink: 'https://facebook.com/johndoe',
        licenseId: null,
        companyName: null,
        bankName: null,
        bankAccountNumber: null,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userUseCase.isProfileComplete('user-id');

      expect(result).toBe(false);
    });
  });

  describe('isBankDetailsComplete', () => {
    it('should return true for complete bank details', async () => {
      const mockUser = {
        id: 'user-id',
        bankName: 'Test Bank',
        bankAccountNumber: '1234567890',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userUseCase.isBankDetailsComplete('user-id');

      expect(result).toBe(true);
    });

    it('should return false for incomplete bank details', async () => {
      const mockUser = {
        id: 'user-id',
        bankName: 'Test Bank',
        bankAccountNumber: null,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userUseCase.isBankDetailsComplete('user-id');

      expect(result).toBe(false);
    });
  });

  describe('validateProfileForListing', () => {
    it('should pass validation for complete profile and staycation listing', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        userType: 'landlord',
        isEmailVerified: true,
        facebookLink: 'https://facebook.com/johndoe',
        licenseId: null,
        companyName: null,
        bankName: 'Test Bank',
        bankAccountNumber: '1234567890',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        userUseCase.validateProfileForListing('user-id', EntityType.STAYCATION),
      ).resolves.toBeUndefined();
    });

    it('should pass validation for complete profile and non-staycation listing', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        userType: 'landlord',
        isEmailVerified: true,
        facebookLink: 'https://facebook.com/johndoe',
        licenseId: null,
        companyName: null,
        bankName: null,
        bankAccountNumber: null,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        userUseCase.validateProfileForListing('user-id', EntityType.RENT),
      ).resolves.toBeUndefined();
    });

    it('should throw error for unverified email', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        userType: 'landlord',
        isEmailVerified: false,
        facebookLink: 'https://facebook.com/johndoe',
        licenseId: null,
        companyName: null,
        bankName: null,
        bankAccountNumber: null,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        userUseCase.validateProfileForListing('user-id', EntityType.STAYCATION),
      ).rejects.toThrow(
        'Profile must be complete before creating a listing. Please fill in all required profile information.',
      );
    });

    it('should throw error for incomplete profile', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: null,
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        userType: 'landlord',
        isEmailVerified: true,
        facebookLink: 'https://facebook.com/johndoe',
        licenseId: null,
        companyName: null,
        bankName: null,
        bankAccountNumber: null,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        userUseCase.validateProfileForListing('user-id', EntityType.STAYCATION),
      ).rejects.toThrow(
        'Profile must be complete before creating a listing. Please fill in all required profile information.',
      );
    });

    it('should throw error for incomplete bank details on staycation', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        userType: 'landlord',
        isEmailVerified: true,
        facebookLink: 'https://facebook.com/johndoe',
        licenseId: null,
        companyName: null,
        bankName: null,
        bankAccountNumber: null,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        userUseCase.validateProfileForListing('user-id', EntityType.STAYCATION),
      ).rejects.toThrow(
        'Bank details must be complete before creating a staycation listing. Please provide your banking information for payouts.',
      );
    });
  });
});
