import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'argon2';

import { Provider } from '@core/interfaces/auth/facebook-auth.interface';
import { UserEntity } from '@core/interfaces/user/user.interface';
import { UserType } from '@core/schemas/user.schema';

import { UserRepository } from '@infrastructure/repositories/user.repository';

import { UserCreateRequest, UserUpdateRequest } from '@presentation/dto/user/user.dto';

import { UserUseCase } from '@use-cases/user/user.use-case';

// Add this at the top with other imports
jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

// Test Factories
const createMockUser = (overrides = {}): UserEntity => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '1234567890',
  password: 'hashedPassword',
  confirmPassword: 'hashedPassword',
  lastLoginAt: null,
  birthDate: new Date('1990-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
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

const createMockCreateUserDto = (overrides = {}): UserCreateRequest => ({
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  phoneNumber: '1234567890',
  ...overrides,
});

const createMockUpdateUserDto = (overrides = {}): UserUpdateRequest => ({
  firstName: 'Updated',
  lastName: 'Name',
  avatar: 'avatar.png',
  userType: UserType.LANDLORD,
  companyName: 'Company Name',
  facebookLink: 'https://www.facebook.com/company',
  ...overrides,
});

// Test Suite Configuration
describe('UserUseCase', () => {
  let userUseCase: UserUseCase;
  let userRepository: jest.Mocked<UserRepository>;

  // Mock Repository Factory
  const createMockRepository = () => ({
    create: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findByIdWithPassword: jest.fn(),
    update: jest.fn(),
    updateRefreshToken: jest.fn(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserUseCase,
        {
          provide: UserRepository,
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    userUseCase = moduleRef.get<UserUseCase>(UserUseCase);
    userRepository = moduleRef.get(UserRepository);
  });

  // Test Suites
  describe('User Creation', () => {
    const hashedPassword = 'hashedPassword123';
    let createUserDto: UserCreateRequest;
    let mockUser: UserEntity;

    beforeEach(() => {
      createUserDto = createMockCreateUserDto();
      mockUser = createMockUser({ password: hashedPassword });
      (hash as jest.Mock).mockImplementation(() => Promise.resolve(hashedPassword));
    });

    describe('createUser', () => {
      it('should successfully create a user with valid data', async () => {
        userRepository.create.mockResolvedValue(mockUser);

        const result = await userUseCase.createUser({
          ...createUserDto,
          password: createUserDto.password,
          confirmPassword: createUserDto.confirmPassword,
          isEmailVerified: false,
          provider: Provider.LOCAL,
          providerId: null,
        });

        expect(hash).toHaveBeenCalledWith(createUserDto.password);
        expect(userRepository.create).toHaveBeenCalledWith({
          ...createUserDto,
          password: hashedPassword,
          confirmPassword: createUserDto.confirmPassword,
          isEmailVerified: false,
          provider: Provider.LOCAL,
          providerId: null,
        });
        expect(result).toEqual(mockUser);
      });

      it('should handle creation failure with appropriate error', async () => {
        userRepository.create.mockRejectedValue(new Error('Database error'));

        await expect(
          userUseCase.createUser({
            ...createUserDto,
            password: createUserDto.password,
            confirmPassword: createUserDto.confirmPassword,
            isEmailVerified: false,
            provider: Provider.LOCAL,
            providerId: null,
          }),
        ).rejects.toThrow(
          new ConflictException('Unable to proceed. Try another email or reset your password'),
        );
      });
    });
  });

  describe('User Queries', () => {
    describe('findByEmail', () => {
      it('should successfully find user by email', async () => {
        const mockUser = createMockUser();
        userRepository.findByEmail.mockResolvedValue(mockUser);

        const result = await userUseCase.findByEmail(mockUser.email);

        expect(userRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
        expect(result).toEqual(mockUser);
      });
    });

    describe('findByEmailWithPassword', () => {
      it('should successfully find user with password by email', async () => {
        const mockUser = createMockUser();
        userRepository.findByEmailWithPassword.mockResolvedValue(mockUser);

        const result = await userUseCase.findByEmailWithPassword(mockUser.email);

        expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(mockUser.email);
        expect(result).toEqual(mockUser);
      });
    });

    describe('findByIdWithPassword', () => {
      it('should successfully find user with password by id', async () => {
        const mockUser = createMockUser();
        userRepository.findByIdWithPassword.mockResolvedValue(mockUser);

        const result = await userUseCase.findByIdWithPassword(mockUser.id);

        expect(userRepository.findByIdWithPassword).toHaveBeenCalledWith(mockUser.id);
        expect(result).toEqual(mockUser);
      });
    });
  });

  describe('User Updates', () => {
    describe('updateUser', () => {
      it('should successfully update user details', async () => {
        const userId = '1';
        const updateUserDto = createMockUpdateUserDto();
        const mockUpdatedUser = createMockUser({
          ...updateUserDto,
          id: userId,
        });

        userRepository.update.mockResolvedValue(mockUpdatedUser);

        const result = await userUseCase.updateUser(userId, updateUserDto);

        expect(userRepository.update).toHaveBeenCalledWith(userId, updateUserDto);
        expect(result).toEqual(mockUpdatedUser);
      });
    });

    describe('updateRefreshToken', () => {
      it('should successfully update refresh token', async () => {
        const userId = '1';
        const refreshToken = 'new-refresh-token';

        userRepository.updateRefreshToken.mockResolvedValue();

        await userUseCase.updateRefreshToken(userId, refreshToken);

        expect(userRepository.updateRefreshToken).toHaveBeenCalledWith(userId, refreshToken);
      });
    });
  });
});
