# Schema Design Best Practices

## Overview

This document outlines the best practices for designing Zod schemas and TypeScript interfaces in our clean architecture project. Following these patterns ensures consistency, maintainability, and type safety across the codebase.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Schema Design Patterns](#schema-design-patterns)
3. [Zod Utilities Guide](#zod-utilities-guide)
4. [Interface Flow](#interface-flow)
5. [Common Patterns](#common-patterns)
6. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
7. [Examples](#examples)

## Core Principles

### 1. DRY (Don't Repeat Yourself)
- **Single Source of Truth**: Define base schemas and derive others from them
- **No Field Duplication**: Use Zod utilities to compose schemas
- **Reusable Validation**: Extract common validation logic

### 2. Composition over Duplication
- Prefer `.pick()`, `.extend()`, `.merge()` over redefining fields
- Build complex schemas from simple, reusable components
- Use schema composition to create variations

### 3. Type Safety First
- Leverage Zod schema inference for TypeScript types
- Avoid using `any` types
- Use strict validation rules

### 4. Clear Hierarchy
- Follow the pattern: Base → Action → Repository → Query schemas
- Maintain clear relationships between schemas
- Use descriptive names that indicate purpose

## Schema Design Patterns

### 1. Base Schema Pattern
```typescript
// Define complete entity schema as single source of truth
export const EntityBaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: z.nativeEnum(EntityStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string().uuid(),
});
```

### 2. Action Schema Pattern
```typescript
// Derive action schemas from base schema
export const CreateEntitySchema = EntityBaseSchema.pick({
  name: true,
  status: true,
});

export const UpdateEntitySchema = EntityBaseSchema.pick({
  name: true,
  status: true,
}).partial();
```

### 3. Repository Schema Pattern
```typescript
// Extend action schemas for repository operations
export const CreateEntityRepositorySchema = CreateEntitySchema.extend({
  userId: z.string().uuid(),
});

export const UpdateEntityRepositorySchema = UpdateEntitySchema;
```

### 4. Query Schema Pattern
```typescript
// Create query schemas with pagination
export const EntityQuerySchema = EntityBaseSchema.pick({
  status: true,
  name: true,
  userId: true,
}).partial().extend({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.enum(['name', 'createdAt', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
```

### 5. Response Schema Pattern
```typescript
// Create response schemas with relations
export const EntityResponseSchema = BaseSchema.merge(EntityBaseSchema);

export const EntityWithRelationsSchema = EntityResponseSchema.extend({
  user: z.object({
    id: z.string().uuid(),
    email: z.string(),
    name: z.string(),
  }).optional(),
  relatedEntities: z.array(EntityResponseSchema).optional(),
});
```

## Zod Utilities Guide

### Core Utilities

#### `.pick()` - Select Specific Fields
```typescript
// Select only specific fields from base schema
const CreateSchema = BaseSchema.pick({
  name: true,
  status: true,
});
```

#### `.omit()` - Exclude Specific Fields
```typescript
// Exclude specific fields from base schema
const PublicSchema = BaseSchema.omit({
  internalField: true,
  secretData: true,
});
```

#### `.extend()` - Add Additional Fields
```typescript
// Add new fields to existing schema
const RepositorySchema = CreateSchema.extend({
  userId: z.string().uuid(),
  metadata: z.record(z.string()),
});
```

#### `.merge()` - Combine Two Schemas
```typescript
// Merge two schemas together
const CompleteSchema = BaseSchema.merge(AdditionalFieldsSchema);
```

#### `.partial()` - Make All Fields Optional
```typescript
// Make all fields optional (for updates)
const UpdateSchema = BaseSchema.pick({
  name: true,
  status: true,
}).partial();
```

#### `.required()` - Make All Fields Required
```typescript
// Make all fields required
const RequiredSchema = OptionalSchema.required();
```

### Advanced Utilities

#### `.transform()` - Transform Data
```typescript
// Transform data during validation
const PaginationSchema = z.object({
  page: z.string().transform(Number),
  limit: z.string().transform(Number),
});
```

#### `.refine()` - Custom Validation
```typescript
// Add custom validation logic
const BookingSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);
```

#### `.preprocess()` - Preprocess Data
```typescript
// Preprocess data before validation
const DateSchema = z.preprocess(
  (val) => new Date(val as string),
  z.date()
);
```

## Interface Flow

### Type Flow Diagram
```
Zod Schemas (src/core/schemas/)
    ↓ (z.infer<typeof Schema>)
Core Interfaces (src/core/interfaces/)
    ↓ (extends createZodDto)
DTOs (src/presentation/dto/)
    ↓ (used in)
Controllers & Use Cases
```

### Implementation Flow
```typescript
// 1. Schema Definition
export const CreateBookingSchema = BookingBaseSchema.pick({
  listingId: true,
  paymentMethod: true,
  passportOrId: true,
});

// 2. Interface Type
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// 3. DTO Class
export class CreateBookingRequest extends createZodDto(CreateBookingSchema) {}

// 4. Usage in Use Case
createBooking(data: CreateBookingInput): Promise<BookingOutput>
```

## Common Patterns

### 1. Pagination Pattern
```typescript
const PaginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Use in query schemas
export const EntityQuerySchema = EntityBaseSchema.pick({
  status: true,
  name: true,
}).partial().merge(PaginationSchema);
```

### 2. Validation Reusability Pattern
```typescript
// Extract common validation logic
const emailValidation = (email: string) => {
  return email.includes('@') && email.includes('.');
};

const passwordValidation = (password: string) => {
  return password.length >= 8 && /[A-Z]/.test(password);
};

// Use in multiple schemas
export const UserSchema = z.object({
  email: z.string().refine(emailValidation, "Invalid email format"),
  password: z.string().refine(passwordValidation, "Password too weak"),
});
```

### 3. Conditional Validation Pattern
```typescript
export const BookingSchema = z.object({
  paymentMethod: z.enum(['CASH', 'CARD']),
  cardDetails: z.object({
    cardNumber: z.string(),
    expiryDate: z.string(),
  }).optional(),
}).refine(
  (data) => {
    if (data.paymentMethod === 'CARD') {
      return data.cardDetails !== undefined;
    }
    return true;
  },
  {
    message: "Card details required for card payment",
    path: ["cardDetails"],
  }
);
```

### 4. Nested Object Pattern
```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string(),
  postalCode: z.string(),
});

export const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: AddressSchema.optional(),
  addresses: z.array(AddressSchema).optional(),
});
```

## Anti-Patterns to Avoid

### ❌ Field Duplication
```typescript
// DON'T: Duplicate field definitions
export const CreateSchema = z.object({
  name: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const UpdateSchema = z.object({
  name: z.string(),        // ❌ Duplicated
  status: z.enum(['ACTIVE', 'INACTIVE']), // ❌ Duplicated
});
```

### ❌ Manual Type Definitions
```typescript
// DON'T: Define types manually
export type CreateInput = {
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
};
```

### ❌ Complex Nested Schemas
```typescript
// DON'T: Create deeply nested schemas without composition
export const ComplexSchema = z.object({
  user: z.object({
    profile: z.object({
      personal: z.object({
        name: z.string(),
        age: z.number(),
      }),
      contact: z.object({
        email: z.string(),
        phone: z.string(),
      }),
    }),
  }),
});
```

### ❌ Inconsistent Naming
```typescript
// DON'T: Use inconsistent naming patterns
export const createUserSchema = z.object({...}); // ❌ camelCase
export const UpdateUserSchema = z.object({...}); // ❌ PascalCase
export const user_query_schema = z.object({...}); // ❌ snake_case
```

## Examples

### Complete Booking Schema Example
```typescript
import { z } from 'zod';
import { BookingStatus, PaymentMethod } from '@prisma/client';

// Base schema
export const BookingBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  listingId: z.string().uuid(),
  status: z.nativeEnum(BookingStatus),
  paymentMethod: z.nativeEnum(PaymentMethod),
  passportOrId: z.string().optional().nullable(),
  payoutStatus: z.nativeEnum(PayoutStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Reusable validation
const bookingValidationRefinement = (_data: unknown) => {
  // Custom validation logic
  return true;
};

// Action schemas
export const CreateBookingSchema = BookingBaseSchema.pick({
  listingId: true,
  paymentMethod: true,
  passportOrId: true,
}).refine(bookingValidationRefinement, {
  message: 'Invalid booking data',
});

export const UpdateBookingSchema = BookingBaseSchema.pick({
  status: true,
  paymentMethod: true,
  passportOrId: true,
  payoutStatus: true,
}).partial();

// Repository schemas
export const CreateBookingRepositorySchema = CreateBookingSchema.extend({
  userId: z.string().uuid(),
});

// Query schemas
export const BookingQuerySchema = BookingBaseSchema.pick({
  status: true,
  paymentMethod: true,
  payoutStatus: true,
  userId: true,
  listingId: true,
}).partial().extend({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
});

// Response schemas
export const BookingResponseSchema = BaseSchema.merge(BookingBaseSchema);

export const BookingWithRelationsSchema = BookingResponseSchema.extend({
  user: z.object({
    id: z.string().uuid(),
    email: z.string(),
    name: z.string(),
  }).optional(),
  listing: z.object({
    id: z.string().uuid(),
    title: z.string(),
    price: z.number(),
  }).optional(),
});
```

### Interface Implementation Example
```typescript
// src/core/interfaces/booking/booking.interface.ts
import { z } from 'zod';
import {
  BookingBaseSchema,
  CreateBookingSchema,
  CreateBookingRepositorySchema,
  UpdateBookingSchema,
  BookingResponseSchema,
  BookingWithRelationsSchema,
  BookingQuerySchema,
} from '@core/schemas/booking.schema';

// ========================================
// BASE ENTITY TYPES
// ========================================
export type BookingEntity = z.infer<typeof BookingBaseSchema>;
export type BookingOutput = z.infer<typeof BookingResponseSchema>;
export type BookingWithRelationsOutput = z.infer<typeof BookingWithRelationsSchema>;

// ========================================
// INPUT TYPES
// ========================================
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;

// ========================================
// QUERY TYPES
// ========================================
export type BookingQueryInput = z.infer<typeof BookingQuerySchema>;

// ========================================
// REPOSITORY TYPES
// ========================================
export type CreateBookingRepositoryInput = z.infer<typeof CreateBookingRepositorySchema>;
export type UpdateBookingRepositoryInput = z.infer<typeof UpdateBookingSchema>;
export type BookingFiltersInput = z.infer<typeof BookingQuerySchema>;
```

## Best Practices Summary

1. **Always use base schemas** as single source of truth
2. **Compose schemas** using Zod utilities instead of duplicating fields
3. **Extract validation logic** into reusable functions
4. **Follow naming conventions** consistently
5. **Use TypeScript inference** from Zod schemas
6. **Maintain clear hierarchy** in schema relationships
7. **Document complex schemas** with comments
8. **Test schemas** with various input scenarios
9. **Keep schemas focused** on single responsibility
10. **Use strict validation** rules by default

## Resources

- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
