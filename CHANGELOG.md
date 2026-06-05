# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-21

### Added
- Initial release of the Tokkatok backend service
- Core Features:
  - User Management:
    - User registration and profile management
    - User avatar handling
    - User preferences and settings
  - Authentication & Authorization:
    - Secure password hashing with Argon2
    - JWT-based authentication
    - Role-based access control (RBAC)
    - Two-factor authentication (2FA)
    - OTP (One-Time Password) support
    - Session management
  - Listing Management:
    - Create, read, update, and delete listings
    - Listing search and filtering
    - Listing categorization
  - Admin Dashboard:
    - User management
    - Content moderation
    - System configuration
  - Email Notifications:
    - Transactional emails
    - Marketing communications
    - System notifications
  - Health Monitoring:
    - System health checks
    - Service status monitoring

### Infrastructure
- NestJS framework implementation
- PostgreSQL database integration with Prisma ORM
- Redis caching system
- AWS S3 integration for file storage
- AWS Textract integration for document processing
- Elastic Enterprise Search integration
- Stripe payment processing
- Email service integration (SendGrid and Mailchimp)
- Sentry error tracking and monitoring
- Swagger/OpenAPI documentation
- Docker containerization
- CI/CD pipeline with GitLab

### Security
- Input validation using Zod
- Rate limiting
- Secure session management
- CORS configuration
- Security headers implementation
- Environment variable management
- Secure file upload handling

### Development
- TypeScript implementation
- Clean Architecture pattern
- Comprehensive test suite with Jest
- ESLint and Prettier configuration
- Development scripts for database management
- Database seeding capabilities
- API documentation generation
- Logging system with Pino

### Database
- Prisma schema implementation
- Database migrations
- Seed data for:
  - Admin users
  - Listings
  - Attribute definitions

### Monitoring and Logging
- Sentry integration for error tracking
- Source map support
- Structured logging with Pino
- Performance monitoring

## [1.0.1] - 2024-03-21

### Added
- Wishlist Feature:
  - User wishlist management
  - Add/remove items from wishlist
  - Wishlist sharing capabilities
  - Wishlist synchronization across devices

- Storefront Enhancement:
  - Storefront creation and management
  - Store customization options
  - Store analytics dashboard
  - Store performance metrics
  - Store branding capabilities

- Router Flow Improvements:
  - Enhanced navigation system
  - Optimized route handling
  - Improved route guards
  - Better route organization
  - Dynamic route loading

### Refactored
- Listing Repository:
  - Improved code organization
  - Enhanced query optimization
  - Better error handling
  - Implemented repository pattern
  - Added caching layer
  - Improved type safety
  - Enhanced test coverage

### Performance
- Optimized database queries
- Improved response times
- Enhanced caching mechanisms
- Better memory management

### Security
- Enhanced input validation
- Improved error handling
- Additional security checks for storefront operations
- Secure wishlist data handling

## [1.0.2] - 2025-01-17

### Added
- **Real-Time Chat System:**
  - WebSocket-based messaging with Socket.IO
  - Real-time typing indicators and message delivery
  - User presence tracking (online/offline status)
  - Message read receipts and notifications
  - Redis caching for performance optimization
  - Email notifications for unread messages

### Fixed
- **Error Handling:**
  - Resolved Sentry error spam issues
  - Improved error filtering and monitoring
  - Enhanced logger performance and formatting

- **Chat System:**
  - Fixed Socket.IO integration issues
  - Improved message delivery reliability
  - Enhanced receiver preview logic

- **Database:**
  - Added cascade delete functionality
  - Improved migration script reliability
  - Better error handling for operations

- **Email Notifications:**
  - Adjusted notification frequency to 2-day intervals
  - Optimized email sending performance

### Performance
- Enhanced Elasticsearch integration
- Optimized database queries with cascade operations
- Improved system responsiveness and reliability

## [1.0.4] - 2025-01-17

### Added
- **User Profile Enhancement:**
  - Added `birthDate` field to user schema and database
  - Enhanced user profile completeness validation
  - Improved user data structure for better profile management

- **Booking System with GCash Integration:**
  - Complete booking flow implementation
  - GCash payment method integration for seamless transactions
  - Booking status management (PENDING_PAYMENT, CONFIRMED, CANCELLED)
  - Payout status tracking for property owners
  - Commission management system
  - Passport/ID document upload requirement
  - Guest and pet count tracking
  - Check-in and check-out date management
  - Booking confirmation and notification system

### Fixed
- **Test Suite:**
  - Fixed missing `birthDate` field in test mocks
  - Resolved Zod validation errors in user-related tests
  - Updated test expectations to include new user fields
  - Converted nanoid mock from JavaScript to TypeScript for better compatibility
  - Fixed all failing unit tests (101 tests now passing)

- **Type Safety:**
  - Improved TypeScript configuration for test files
  - Enhanced mock service type definitions
  - Better error handling in test utilities

### Technical Improvements
- Updated Jest configuration for better TypeScript support
- Improved test mock factories for consistent data generation
- Enhanced test coverage and reliability
- Better separation of concerns in test utilities
