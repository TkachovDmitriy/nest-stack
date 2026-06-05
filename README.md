# @Node.js Clean Architecture API

@Enterprise-grade Node.js API implementation following clean architecture principles and security-first approach.

## @Project Overview
This project demonstrates a production-ready Node.js API with:
- Clean Architecture implementation
- Type-safe development with TypeScript
- Comprehensive security features
- Scalable infrastructure design
- Automated testing suite

## @Architecture Overview

```
@src/
├── core/                # @Core business logic and domain rules
│   ├── schemas/        # @Validation schemas and data contracts
│   └── types/          # @TypeScript interfaces and types
│
├── presentation/        # @API Layer handling HTTP concerns
│   └── controllers/    # @Route controllers and request handling
│
├── infrastructure/      # @External services & technical concerns
│   ├── auth/           # @Authentication and authorization
│   ├── common/         # @Shared utilities and filters
│   │   ├── filters/    # @Exception handling and filtering
│   │   └── helpers/    # @Utility functions and helpers
│   └── configs/        # @Application configuration
```

## @Quick Start

### @Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis
- AWS Account (for S3 features)

### @Installation Steps

```bash
# @Install project dependencies
npm install

# @Create environment configuration
cp .env.example .env

# @Start development server
npm run dev
```

## @Security Features

@Authentication
- JWT-based authentication with refresh tokens
- Secure token management
- Role-based access control (RBAC)

@Protection
- Rate limiting on sensitive endpoints
- CSRF protection for forms
- Request validation using Zod
- Security headers (HSTS, CSP)
- 2FA support (in progress)

## @Core Features

### @Authentication Flow
- Secure login/signup process
- Token-based session management
- Permission-based access control

### @Health Monitoring
- @Database health verification
- @Redis connectivity checks
- @S3 storage validation
- @Service status monitoring

### @Infrastructure
- @Database connection pooling
- @Query timeout mechanisms
- @Error logging system
- @Performance metrics collection

## @API Documentation

@Access OpenAPI documentation:
```
/reference
```
## @Testing Commands

```bash
# @Run unit tests
npm run test

# @Execute integration tests
npm run test:integration

# @Generate coverage report
npm run test:coverage
```

## @Environment Setup

@Required environment variables:
```env
# @Server Configuration
NODE_ENV=development
PORT=3000

# @Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# @Redis Configuration
REDIS_URL=redis://localhost:6379

# @JWT Configuration
JWT_SECRET=your-secret-key

# @AWS Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
```

## @Development Workflow

1. @Branch: Create feature branch from `develop`
2. @Implementation: Follow clean architecture principles
3. @Testing: Add unit and integration tests
4. @Documentation: Update API docs and comments
5. @Review: Create PR with detailed description
6. @CI/CD: Pass automated checks
7. @Merge: Code review and integration

## @Documentation

### @Core Documentation
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Architecture and file organization
- [Naming Conventions](docs/NAMING_CONVENTIONS.md) - Code style and naming patterns
- [Schema Design Best Practices](docs/SCHEMA_DESIGN_BEST_PRACTICES.md) - Zod schema patterns and interface design
- [Schema Design Quick Reference](docs/SCHEMA_DESIGN_QUICK_REFERENCE.md) - Quick patterns and cheat sheet
- [Performance Analysis](docs/PERFORMANCE_ANALYSIS.md) - Performance optimization guidelines
- [Release Process](docs/RELEASE_PROCESS.md) - Deployment and release procedures

### @Development Guides
- [Slug Migration Guide](docs/SLUG_MIGRATION_GUIDE.md) - Database migration procedures

## @Roadmap

@See [TODO.md](TODO.md) for detailed development plans and progress tracking.