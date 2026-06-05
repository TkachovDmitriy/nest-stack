# nest-stack

A production-ready **NestJS** boilerplate built on Clean Architecture. It ships the cross-cutting concerns you usually rebuild on every project — authentication, 2FA, email, file storage, search, logging, error tracking, and API docs — so you can start on features instead of plumbing.

> Uses pnpm, TypeScript, Prisma + PostgreSQL, Redis, and Zod-based validation.

---

## Features

- **Clean Architecture** — strict separation between `core`, `use-cases`, `infrastructure`, and `presentation` layers.
- **Authentication** — JWT access/refresh tokens, `argon2` password hashing, Facebook social login, password reset flow.
- **Two-Factor Auth (2FA)** — OTP-based enable/confirm/disable flows (`@oslojs/otp`).
- **Validation** — Zod schemas wired into NestJS via `nestjs-zod` and a global validation pipe.
- **Database** — Prisma 6 ORM with a multi-file schema (`prisma/schema/`) and migrations.
- **Caching** — Redis via `ioredis`.
- **Email** — SendGrid and Mailchimp Transactional providers.
- **File storage** — AWS S3 (uploads, presigned URLs).
- **Search** — Elasticsearch (with legacy Enterprise App Search support).
- **Observability** — Pino structured logging and Sentry error/performance tracking.
- **API docs** — Auto-generated OpenAPI served through a [Scalar](https://scalar.com) reference UI at `/reference` (Basic-Auth protected).
- **Security** — reCAPTCHA guard, rate limiting, CORS configuration.

## Tech Stack

| Concern         | Choice                     |
| --------------- | -------------------------- |
| Framework       | NestJS 10 (Express)        |
| Language        | TypeScript 5               |
| Database        | PostgreSQL 17 + Prisma 6   |
| Cache           | Redis                      |
| Validation      | Zod + nestjs-zod           |
| Auth            | JWT, argon2, OTP           |
| Logging         | Pino                       |
| Monitoring      | Sentry                     |
| Package manager | pnpm                       |

## Project Structure

```
src/
├── core/                 # Framework-agnostic domain layer
│   ├── schemas/          # Zod validation schemas
│   ├── interfaces/       # Domain interfaces
│   ├── types/            # Shared types
│   └── utils/            # Pure utilities
│
├── use-cases/            # Application business logic (orchestration)
│   ├── auth/             # Sign up, login, tokens, 2FA
│   ├── email/            # Email sending
│   ├── user/             # User management
│   └── health-check/     # Liveness/readiness checks
│
├── infrastructure/       # External concerns & technical adapters
│   ├── auth/             # Token, permission & role services, route guards
│   ├── bootstrap/        # Application bootstrap (Sentry, CORS, filters…)
│   ├── common/           # Filters, guards, pipes, interceptors, decorators
│   ├── configs/          # App/env/CORS/logger/swagger config
│   ├── database/         # Prisma module & service
│   ├── elasticsearch/    # Search services
│   ├── logger/           # Pino logger
│   ├── redis/            # Redis service
│   ├── repositories/     # Data-access layer
│   └── s3/               # File storage
│
└── presentation/         # HTTP layer
    ├── controllers/      # Route controllers
    └── dto/              # Request/response DTOs
```

### Path aliases

Configured in `tsconfig.json` / Jest:

| Alias               | Resolves to                   |
| ------------------- | ----------------------------- |
| `~/*`               | `src/*`                       |
| `@core/*`           | `src/core/*`                  |
| `@use-cases/*`      | `src/use-cases/*`             |
| `@infrastructure/*` | `src/infrastructure/*`        |
| `@common/*`         | `src/infrastructure/common/*` |
| `@auth/*`           | `src/infrastructure/auth/*`   |
| `@presentation/*`   | `src/presentation/*`          |

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm**
- **Docker** (for local PostgreSQL, Redis, and a mail server) — or your own instances

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then fill in the values. Key variables:

| Variable                                      | Description                          |
| --------------------------------------------- | ------------------------------------ |
| `PORT` / `HTTP_PORT`                          | HTTP port (default `3000`)           |
| `NODE_ENV`                                    | `development` / `production`         |
| `DATABASE_URL`                                | PostgreSQL connection string         |
| `REDIS_URL`                                   | Redis connection string              |
| `CORS_ORIGIN`                                 | Comma-separated allowed origins      |
| `API_ADMIN_USER` / `API_ADMIN_PASSWORD`       | Basic-Auth for `/reference` docs     |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL`    | Email delivery                       |
| `AWS_*`                                        | S3 credentials & bucket              |
| `RECAPTCHA_SECRET_KEY` / `RECAPTCHA_SITE_KEY` | reCAPTCHA verification               |
| `SENTRY_DSN`                                  | Error tracking (production)          |

### 3. Start backing services

Spins up PostgreSQL, Redis, and an [smtp4dev](https://github.com/rnwood/smtp4dev) mailbox (UI on `http://localhost:9000`):

```bash
pnpm docker:deps
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start the app

```bash
pnpm start:dev
```

The API is now running on `http://localhost:3000`, with interactive docs at **`http://localhost:3000/reference`**.

## Available Scripts

| Script                  | Description                            |
| ----------------------- | -------------------------------------- |
| `pnpm start:dev`        | Start in watch mode (pretty logs)      |
| `pnpm start:debug`      | Start in watch + debug mode            |
| `pnpm build`            | Compile to `dist/`                     |
| `pnpm start:prod`       | Run the compiled build                 |
| `pnpm lint`             | ESLint (with autofix)                  |
| `pnpm format`           | Prettier format                        |
| `pnpm test`             | Unit tests (Jest)                      |
| `pnpm test:cov`         | Tests with coverage                    |
| `pnpm test:e2e`         | End-to-end tests                       |
| `pnpm db:migrate`       | Apply Prisma migrations (dev)          |
| `pnpm db:migrate:prod`  | Apply migrations (production / deploy) |
| `pnpm db:seed:admin`    | Seed an admin user                     |
| `pnpm docker:deps`      | Start Postgres + Redis + mail server   |
| `pnpm docker:down`      | Stop backing services                  |
| `pnpm generate:swagger` | Generate the OpenAPI spec to `swagger/`|

## API Overview

Auth is enforced globally; endpoints opt out with a `@Public()` decorator. Protected routes expect a Bearer access token.

### Auth (`/auth`)

| Method | Endpoint                         | Description                    |
| ------ | -------------------------------- | ------------------------------ |
| POST   | `/auth/signup`                   | Register a new user            |
| POST   | `/auth/login`                    | Log in, returns tokens         |
| POST   | `/auth/refresh`                  | Refresh access token           |
| POST   | `/auth/facebook`                 | Log in with Facebook           |
| POST   | `/auth/verify-email-code`        | Verify email address           |
| POST   | `/auth/resend-verification-code` | Resend email verification code |
| POST   | `/auth/password-reset/initiate`  | Start password reset           |
| POST   | `/auth/password-reset/verify`    | Verify reset code              |
| POST   | `/auth/password-reset/complete`  | Set a new password             |
| POST   | `/auth/2fa/enable`               | Begin enabling 2FA             |
| POST   | `/auth/2fa/confirm`              | Confirm 2FA enable             |
| POST   | `/auth/2fa/verify`               | Verify 2FA on login            |
| POST   | `/auth/2fa/disable`              | Disable 2FA                    |
| POST   | `/auth/update-user-role`         | Update a user's role           |

### Health (`/health`)

| Method | Endpoint        | Description           |
| ------ | --------------- | --------------------- |
| GET    | `/health/http`  | Service liveness      |
| GET    | `/health/db`    | Database connectivity |
| GET    | `/health/redis` | Redis connectivity    |

> Browse the full, always-current schema in the Scalar UI at `/reference`.

## Documentation

In-depth guides, conventions, and engineering practices live in [`docs/`](./docs):

| Document                                                                     | What it covers                                  |
| ---------------------------------------------------------------------------- | ----------------------------------------------- |
| [PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)                          | Clean Architecture layers and responsibilities  |
| [NAMING_CONVENTIONS.md](./docs/NAMING_CONVENTIONS.md)                        | File, class, and symbol naming conventions      |
| [SCHEMA_DESIGN_BEST_PRACTICES.md](./docs/SCHEMA_DESIGN_BEST_PRACTICES.md)    | Zod / Prisma schema design guidelines           |
| [SIMPLE_API_RESPONSES_GUIDE.md](./docs/SIMPLE_API_RESPONSES_GUIDE.md)        | Conventions for API response shapes             |
| [CODE_OPTIMIZATION_STRATEGY.md](./docs/CODE_OPTIMIZATION_STRATEGY.md)        | Code-level optimization strategy                |
| [PERFORMANCE_ANALYSIS.md](./docs/PERFORMANCE_ANALYSIS.md)                    | Performance profiling and analysis              |
| [PERFORMANCE_OPTIMIZATION_TODO.md](./docs/PERFORMANCE_OPTIMIZATION_TODO.md)  | Outstanding performance work                    |
| [REFACTORING_STRATEGY_BRAINSTORM.md](./docs/REFACTORING_STRATEGY_BRAINSTORM.md) | Refactoring ideas and strategy               |
| [RELEASE_PROCESS.md](./docs/RELEASE_PROCESS.md)                              | Versioning and release workflow                 |

Module-level notes:

- [`scripts/README.md`](./scripts/README.md) — maintenance & migration scripts
- [`src/infrastructure/logger/README.md`](./src/infrastructure/logger/README.md) — logging setup
- [`src/infrastructure/repl/README.md`](./src/infrastructure/repl/README.md) — interactive REPL usage

## Testing

```bash
pnpm test        # unit tests
pnpm test:e2e    # end-to-end tests
pnpm test:cov    # coverage report
```

## Deployment

A production `Dockerfile` is included. Build the image and run it with the appropriate environment variables; apply migrations on deploy with:

```bash
pnpm db:migrate:prod
```

## License

UNLICENSED — private project.
