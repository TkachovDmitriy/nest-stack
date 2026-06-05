# Naming Conventions

## Overview

This document defines the naming conventions used throughout the project to maintain consistency and clarity across all layers of the clean architecture.

## File Naming

### 1. File Names
- Use **kebab-case** for file names
- Use descriptive names that indicate the purpose
- Group related files in directories by feature

**Examples:**
```
listing-management.controller.ts
user-profile.service.ts
booking-repository.ts
auth-guard.ts
```

### 2. Directory Names
- Use **kebab-case** for directory names
- Use plural forms for collections of similar files
- Use descriptive names that indicate the content

**Examples:**
```
src/core/interfaces/
src/presentation/controllers/
src/use-cases/booking/
src/infrastructure/repositories/
```

## Type Naming Conventions

### 1. Schema Naming (`src/core/schemas/`)

#### Base Schemas
- **Pattern**: `EntityNameSchema`
- **Purpose**: Base entity validation schemas
- **Example**: `UserSchema`, `ListingSchema`, `BookingSchema`

#### Action Schemas
- **Pattern**: `ActionEntityNameSchema`
- **Purpose**: Specific action validation schemas
- **Examples**:
  - `CreateListingSchema`
  - `UpdateUserSchema`
  - `GetBookingSchema`
  - `DeleteListingSchema`

#### Response Schemas
- **Pattern**: `EntityNameResponseSchema`
- **Purpose**: Response validation schemas
- **Examples**:
  - `ListingResponseSchema`
  - `UserResponseSchema`
  - `BookingWithRelationsSchema`
  - `PublicListingSchema`

#### Query Schemas
- **Pattern**: `EntityNameQuerySchema`
- **Purpose**: Query parameter validation schemas
- **Examples**:
  - `ListingQuerySchema`
  - `BookingQuerySchema`
  - `UserSearchQuerySchema`

### 2. Interface Naming (`src/core/interfaces/`)

#### Entity Types
- **Pattern**: `EntityNameEntity`
- **Purpose**: Base entity types inferred from schemas
- **Examples**:
  ```typescript
  export type UserEntity = z.infer<typeof UserSchema>;
  export type ListingEntity = z.infer<typeof ListingSchema>;
  export type BookingEntity = z.infer<typeof BookingSchema>;
  ```

#### Input Types
- **Pattern**: `ActionEntityNameInput`
- **Purpose**: Use case input types
- **Examples**:
  ```typescript
  export type CreateListingInput = z.infer<typeof CreateListingSchema>;
  export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
  export type GetBookingInput = z.infer<typeof GetBookingSchema>;
  ```

#### Output Types
- **Pattern**: `EntityNameOutput`
- **Purpose**: Use case output types
- **Examples**:
  ```typescript
  export type ListingOutput = z.infer<typeof ListingResponseSchema>;
  export type ListingDBOutput = z.infer<typeof ListingDBSchema>;
  export type PublicListingOutput = z.infer<typeof PublicListingSchema>;
  export type BookingWithRelationsOutput = z.infer<typeof BookingWithRelationsSchema>;
  ```

#### Query Types
- **Pattern**: `EntityNameQueryInput`
- **Purpose**: Query parameter types
- **Examples**:
  ```typescript
  export type ListingQueryInput = z.infer<typeof ListingQuerySchema>;
  export type BookingQueryInput = z.infer<typeof BookingQuerySchema>;
  export type UserSearchQueryInput = z.infer<typeof UserSearchQuerySchema>;
  ```

#### Repository Types
- **Pattern**: `ActionEntityNameRepositoryInput` or `EntityNameRepositoryInput`
- **Purpose**: Repository operation types
- **Examples**:
  ```typescript
  export type CreateBookingRepositoryInput = z.infer<typeof CreateBookingRepositorySchema>;
  export type UpdateBookingRepositoryInput = z.infer<typeof UpdateBookingSchema>;
  export type BookingFiltersInput = z.infer<typeof BookingQuerySchema>;
  ```

### 3. DTO Naming (`src/presentation/dto/`)

#### Request DTOs
- **Pattern**: `ActionEntityNameRequest`
- **Purpose**: Incoming request DTOs
- **Examples**:
  ```typescript
  export class CreateListingRequest extends createZodDto(CreateListingSchema) {}
  export class UpdateUserRequest extends createZodDto(UpdateUserSchema) {}
  export class GetBookingRequest extends createZodDto(GetBookingSchema) {}
  ```

#### Response DTOs
- **Pattern**: `EntityNameResponse`
- **Purpose**: Outgoing response DTOs
- **Examples**:
  ```typescript
  export class ListingResponse extends createZodDto(ListingResponseSchema) {}
  export class PublicListingResponse extends createZodDto(PublicListingSchema) {}
  export class BookingWithRelationsResponse extends createZodDto(BookingWithRelationsSchema) {}
  ```

#### Query DTOs
- **Pattern**: `EntityNameQueryDto`
- **Purpose**: Query parameter DTOs
- **Examples**:
  ```typescript
  export class ListingQueryDto extends createZodDto(ListingQuerySchema) {}
  export class BookingQueryDto extends createZodDto(BookingQuerySchema) {}
  ```

## Class Naming Conventions

### 1. Controllers
- **Pattern**: `EntityNameController` or `EntityNameManagementController`
- **Purpose**: HTTP request handlers
- **Examples**:
  ```typescript
  export class ListingController {}
  export class ListingManagementController {}
  export class BookingController {}
  export class UserController {}
  ```

### 2. Use Cases
- **Pattern**: `EntityNameUseCase`
- **Purpose**: Business logic handlers
- **Examples**:
  ```typescript
  export class ListingUseCase {}
  export class BookingUseCase {}
  export class UserUseCase {}
  export class EmailUseCase {}
  ```

### 3. Repositories
- **Pattern**: `EntityNameRepository`
- **Purpose**: Data access layer
- **Examples**:
  ```typescript
  export class ListingRepository {}
  export class BookingRepository {}
  export class UserRepository {}
  ```

### 4. Services
- **Pattern**: `EntityNameService`
- **Purpose**: Domain or infrastructure services
- **Examples**:
  ```typescript
  export class EmailService {}
  export class PaymentService {}
  export class SearchService {}
  export class AuthService {}
  ```

### 5. Guards
- **Pattern**: `EntityNameGuard` or `ActionGuard`
- **Purpose**: Authentication and authorization
- **Examples**:
  ```typescript
  export class JwtAuthGuard {}
  export class UserProfileCompleteGuard {}
  export class PermissionGuard {}
  ```

### 6. Decorators
- **Pattern**: `ActionDecorator` or `EntityNameDecorator`
- **Purpose**: Custom decorators
- **Examples**:
  ```typescript
  export const CurrentUser = createParamDecorator();
  export const RequirePermissionGroup = (group: PermissionGroup) => {};
  export const Public = () => SetMetadata('isPublic', true);
  ```

## Variable and Function Naming

### 1. Variables
- Use **camelCase** for variables
- Use descriptive names
- Use boolean prefixes for boolean variables

**Examples:**
```typescript
const userListings = await listingRepository.findByUserId(userId);
const isEmailVerified = user.isEmailVerified;
const hasPermission = await permissionService.checkPermission(user, permission);
const totalCount = await repository.count(filters);
```

### 2. Functions
- Use **camelCase** for functions
- Use verb-noun pattern for action functions
- Use descriptive names that indicate the purpose

**Examples:**
```typescript
async createListing(data: CreateListingInput): Promise<ListingOutput> {}
async updateUserProfile(userId: string, data: UpdateUserInput): Promise<UserOutput> {}
async validateBookingRequest(data: CreateBookingInput): Promise<boolean> {}
async sendEmailNotification(to: string, template: string): Promise<void> {}
```

### 3. Constants
- Use **UPPER_SNAKE_CASE** for constants
- Use descriptive names

**Examples:**
```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_PAGE_SIZE = 10;
export const JWT_EXPIRATION_TIME = '24h';
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
```

## Enum Naming

### 1. Enum Names
- Use **PascalCase** for enum names
- Use descriptive names that indicate the purpose

**Examples:**
```typescript
export enum UserType {
  LANDLORD = 'landlord',
  REAL_ESTATE_AGENT = 'real_estate_agent',
  CUSTOMER = 'customer',
}

export enum ListingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REJECTED = 'rejected',
}

export enum PermissionGroup {
  LISTING = 'listing',
  PROFILE = 'profile',
  ADMIN = 'admin',
}
```

### 2. Enum Values
- Use **UPPER_SNAKE_CASE** for enum values
- Use descriptive values that are self-explanatory

## Interface Naming

### 1. Interface Names
- Use **PascalCase** for interface names
- Use descriptive names that indicate the purpose
- Avoid using "I" prefix

**Examples:**
```typescript
export interface EmailProvider {
  sendEmail(to: string, subject: string, content: string): Promise<void>;
}

export interface SearchService {
  search(query: SearchQuery): Promise<SearchResponse>;
}

export interface PaymentProcessor {
  processPayment(data: PaymentData): Promise<PaymentResult>;
}
```

## Module Naming

### 1. Module Names
- Use **PascalCase** for module names
- Use descriptive names that indicate the purpose

**Examples:**
```typescript
@Module({
  imports: [PrismaModule, EmailModule],
  providers: [ListingUseCase, ListingRepository],
  exports: [ListingUseCase],
})
export class ListingModule {}
```

## Import Organization

### 1. Import Order
1. Node.js built-ins
2. Third-party libraries
3. Internal modules (absolute paths with `@` aliases)
4. Relative imports

### 2. Import Grouping
```typescript
// Node.js built-ins
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// Third-party libraries
import { createZodDto } from 'nestjs-zod';

// Internal modules (absolute paths)
import { CreateListingInput } from '@core/interfaces/listing/listing.interface';
import { ListingRepository } from '@infrastructure/repositories/listing.repository';
import { CreateListingRequest } from '@presentation/dto/listing/listing.dto';

// Relative imports (if needed)
import { SomeLocalFile } from './some-local-file';
```

## Type Definition Patterns

### 1. Interface File Structure
```typescript
import { z } from 'zod';
import { EntitySchema, CreateEntitySchema, UpdateEntitySchema } from '@core/schemas/entity.schema';

// ========================================
// BASE ENTITY TYPES
// ========================================
export type EntityEntity = z.infer<typeof EntitySchema>;
export type EntityOutput = z.infer<typeof EntityResponseSchema>;

// ========================================
// INPUT TYPES
// ========================================
export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;
export type UpdateEntityInput = z.infer<typeof UpdateEntitySchema>;

// ========================================
// QUERY TYPES
// ========================================
export type EntityQueryInput = z.infer<typeof EntityQuerySchema>;

// ========================================
// REPOSITORY TYPES
// ========================================
export type CreateEntityRepositoryInput = z.infer<typeof CreateEntityRepositorySchema>;
export type UpdateEntityRepositoryInput = z.infer<typeof UpdateEntitySchema>;
export type EntityFiltersInput = z.infer<typeof EntityQuerySchema>;
```

### 2. DTO File Structure
```typescript
import { createZodDto } from 'nestjs-zod';
import { CreateEntitySchema, UpdateEntitySchema, EntityResponseSchema } from '@core/schemas/entity.schema';

// ========================================
// REQUEST DTOs
// ========================================
export class CreateEntityRequest extends createZodDto(CreateEntitySchema) {}
export class UpdateEntityRequest extends createZodDto(UpdateEntitySchema) {}

// ========================================
// RESPONSE DTOs
// ========================================
export class EntityResponse extends createZodDto(EntityResponseSchema) {}
export class EntityWithRelationsResponse extends createZodDto(EntityWithRelationsSchema) {}

// ========================================
// QUERY DTOs
// ========================================
export class EntityQueryDto extends createZodDto(EntityQuerySchema) {}
```

## Best Practices

### 1. Consistency
- Always follow the established naming patterns
- Be consistent across all files and modules
- Use the same naming conventions for similar concepts

### 2. Clarity
- Use descriptive names that clearly indicate the purpose
- Avoid abbreviations unless they are widely understood
- Make names self-documenting

### 3. Maintainability
- Choose names that will still make sense in the future
- Consider the context and domain when naming
- Use names that reflect the business domain

### 4. Type Safety
- Use TypeScript's type system effectively
- Leverage Zod schema inference for type safety
- Avoid using `any` types

### 5. Documentation
- Use JSDoc comments for complex functions and types
- Document the purpose and usage of custom types
- Keep documentation up to date with code changes
