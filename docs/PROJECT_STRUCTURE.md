# Project Structure

## Overview

This project implements Clean Architecture principles with a clear separation of concerns across different layers. The architecture is designed to be maintainable, testable, and scalable.

## Architecture Layers

### 1. Core Layer (`src/core/`)
The innermost layer containing business logic and domain entities.

#### Structure:
```
src/core/
├── constants/          # Application-wide constants
├── interfaces/         # Type definitions and domain interfaces
├── mappers/           # Data transformation logic
├── schemas/           # Zod validation schemas
├── services/          # Domain services
└── types/             # Global type definitions
```

#### Responsibilities:
- **Constants**: Application-wide constants and configuration
- **Interfaces**: Type definitions for entities, inputs, outputs, and queries
- **Mappers**: Data transformation between different layers
- **Schemas**: Zod validation schemas for data validation
- **Services**: Domain-specific business logic
- **Types**: Global type definitions and utilities

### 2. Infrastructure Layer (`src/infrastructure/`)
Handles external concerns like databases, external APIs, and infrastructure services.

#### Structure:
```
src/infrastructure/
├── auth/              # Authentication & authorization
├── common/            # Shared infrastructure code
├── database/          # Database configuration and connections
├── elasticsearch/     # Search functionality
├── email/             # Email services and providers
├── paymongo/          # Payment processing
├── redis/             # Caching layer
├── repositories/      # Data access layer
└── s3/                # File storage
```

#### Responsibilities:
- **Auth**: Authentication, authorization, and security
- **Common**: Shared utilities, guards, decorators, pipes
- **Database**: Database connections, migrations, and configuration
- **Elasticsearch**: Search functionality and indexing
- **Email**: Email service providers and templates
- **PayMongo**: Payment processing integration
- **Redis**: Caching and session management
- **Repositories**: Data access and persistence
- **S3**: File storage and management

### 3. Use Cases Layer (`src/use-cases/`)
Contains application-specific business logic and orchestrates the flow of data.

#### Structure:
```
src/use-cases/
├── auth/             # Authentication use cases
├── booking/          # Booking management use cases
├── email/            # Email sending use cases
├── listing/          # Listing management use cases
└── user/             # User management use cases
```

#### Responsibilities:
- Implement business logic for specific features
- Orchestrate data flow between layers
- Handle business rules and validations
- Coordinate between repositories and external services

### 4. Presentation Layer (`src/presentation/`)
Handles HTTP requests, responses, and API endpoints.

#### Structure:
```
src/presentation/
├── controllers/       # HTTP controllers
└── dto/              # Data Transfer Objects
```

#### Responsibilities:
- **Controllers**: Handle HTTP requests and responses
- **DTOs**: Define request/response data structures

## Type Organization

### Type Hierarchy

```
Zod Schemas (src/core/schemas/)
    ↓
Core Interfaces (src/core/interfaces/)
    ↓
DTOs (src/presentation/dto/)
    ↓
Controllers & Use Cases
```

### Type Flow

1. **Schemas** define validation rules and structure
2. **Interfaces** provide TypeScript types inferred from schemas
3. **DTOs** create request/response classes with validation
4. **Use Cases** use input/output types for business logic
5. **Controllers** use DTOs for API handling

## File Organization Rules

### 1. Feature-Based Organization
Each feature should have its own directory structure:

```
feature-name/
├── schemas/           # Feature-specific schemas
├── interfaces/        # Feature-specific interfaces
├── dto/              # Feature-specific DTOs
├── repositories/     # Feature-specific repositories
├── use-cases/        # Feature-specific use cases
└── controllers/      # Feature-specific controllers
```

### 2. Layer-Based Organization
Files are organized by architectural layers:

```
src/
├── core/             # Domain layer
│   ├── schemas/      # All validation schemas
│   ├── interfaces/   # All type definitions
│   └── ...
├── infrastructure/   # Infrastructure layer
│   ├── repositories/ # All data access
│   ├── auth/         # All authentication
│   └── ...
├── use-cases/        # Application layer
│   ├── feature1/     # Feature-specific use cases
│   ├── feature2/     # Feature-specific use cases
│   └── ...
└── presentation/     # Presentation layer
    ├── controllers/  # All HTTP controllers
    ├── dto/          # All DTOs
    └── ...
```

### 3. Import Organization
Follow this import order:

```typescript
// 1. Node.js built-ins
import { Injectable } from '@nestjs/common';

// 2. Third-party libraries
import { z } from 'zod';

// 3. Internal modules (absolute paths)
import { CreateListingInput } from '@core/interfaces/listing/listing.interface';
import { ListingRepository } from '@infrastructure/repositories/listing.repository';
import { CreateListingRequest } from '@presentation/dto/listing/listing.dto';

// 4. Relative imports (if needed)
import { SomeLocalFile } from './some-local-file';
```

## Development Workflow

### Creating New Features

1. **Define Schemas** (`src/core/schemas/`)
   - Create Zod validation schemas
   - Define base, action, response, and query schemas

2. **Create Interfaces** (`src/core/interfaces/`)
   - Define entity, input, output, and query types
   - Use Zod schema inference for type safety

3. **Create DTOs** (`src/presentation/dto/`)
   - Create request and response DTOs
   - Use `createZodDto` for automatic validation

4. **Implement Repository** (`src/infrastructure/repositories/`)
   - Create data access layer
   - Use repository types from interfaces

5. **Implement Use Case** (`src/use-cases/`)
   - Implement business logic
   - Use input/output types from interfaces

6. **Create Controller** (`src/presentation/controllers/`)
   - Implement API endpoints
   - Use DTOs for request/response handling

7. **Update Modules**
   - Register new components in appropriate modules
   - Configure dependencies and providers

### Example: Creating a "Review" Feature

```
1. src/core/schemas/review.schema.ts
   - ReviewSchema, CreateReviewSchema, ReviewResponseSchema

2. src/core/interfaces/review/review.interface.ts
   - ReviewEntity, CreateReviewInput, ReviewOutput

3. src/presentation/dto/review/review.dto.ts
   - CreateReviewRequest, ReviewResponse

4. src/infrastructure/repositories/review.repository.ts
   - ReviewRepository with proper types

5. src/use-cases/review/review.use-case.ts
   - ReviewUseCase with business logic

6. src/presentation/controllers/review.controller.ts
   - ReviewController with API endpoints

7. Update modules to include new components
```

## Module Organization

### 1. Feature Modules
Each feature should have its own module:

```typescript
@Module({
  imports: [PrismaModule, EmailModule],
  providers: [ListingUseCase, ListingRepository],
  controllers: [ListingController],
  exports: [ListingUseCase],
})
export class ListingModule {}
```

### 2. Shared Modules
Common functionality should be in shared modules:

```typescript
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 3. App Module
The main application module imports all feature modules:

```typescript
@Module({
  imports: [
    AuthModule,
    UserModule,
    ListingModule,
    BookingModule,
    EmailModule,
  ],
})
export class AppModule {}
```

## Configuration Management

### 1. Environment Configuration
- Use `.env` files for environment-specific configuration
- Validate environment variables on startup
- Use proper default values

### 2. Feature Flags
- Implement feature toggles for gradual rollouts
- Use configuration-based feature flags
- Test with different configurations

## Testing Structure

### 1. Unit Tests
- Test use cases in isolation
- Mock dependencies
- Test business logic thoroughly

### 2. Integration Tests
- Test API endpoints
- Test database operations
- Test external service integrations

### 3. E2E Tests
- Test complete user workflows
- Test critical business paths
- Test error scenarios

## Security Architecture

### 1. Authentication
- JWT-based authentication
- Role-based access control
- Permission-based authorization

### 2. Input Validation
- Zod schema validation
- Request sanitization
- SQL injection prevention

### 3. Error Handling
- Proper error types
- Secure error messages
- Error logging and monitoring

## Performance Considerations

### 1. Database Optimization
- Proper indexing strategies
- Query optimization
- Connection pooling

### 2. Caching Strategy
- Redis for session management
- Application-level caching
- Database query caching

### 3. API Optimization
- Pagination for large datasets
- Response compression
- Rate limiting

## Monitoring and Logging

### 1. Logging Strategy
- Structured logging
- Log levels (error, warn, info, debug)
- Log aggregation and analysis

### 2. Monitoring
- API performance monitoring
- Database performance monitoring
- External service health checks

### 3. Metrics
- Business metrics tracking
- Technical metrics tracking
- Alerting and notifications

## Deployment Architecture

### 1. Containerization
- Docker containerization
- Multi-stage builds
- Environment-specific configurations

### 2. CI/CD Pipeline
- Automated testing
- Automated deployment
- Environment promotion

### 3. Infrastructure
- Cloud-native deployment
- Auto-scaling capabilities
- Load balancing

## Best Practices

### 1. Code Organization
- Follow single responsibility principle
- Keep functions and classes small
- Use meaningful names and comments

### 2. Error Handling
- Use proper error types
- Handle errors gracefully
- Provide meaningful error messages

### 3. Performance
- Optimize database queries
- Implement proper caching
- Use pagination for large datasets

### 4. Security
- Validate all inputs
- Use proper authentication/authorization
- Sanitize data before database operations

### 5. Testing
- Write comprehensive tests
- Use proper mocking strategies
- Test error scenarios

## Migration Strategy

### 1. Database Migrations
- Use Prisma migrations
- Version control migrations
- Test migrations in staging

### 2. API Versioning
- Use URL versioning
- Maintain backward compatibility
- Deprecate old versions gradually

### 3. Feature Rollouts
- Use feature flags
- Gradual rollouts
- A/B testing capabilities

## Documentation

### 1. API Documentation
- OpenAPI/Swagger documentation
- Interactive API explorer
- Code examples

### 2. Code Documentation
- JSDoc comments
- README files
- Architecture decision records

### 3. User Documentation
- User guides
- API reference
- Troubleshooting guides
