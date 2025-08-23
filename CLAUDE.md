# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Start

- `npm run build` - Build the NestJS application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with watch
- `npm run start:debug` - Start in debug mode with watch
- `npm run start:prod` - Start in production mode

### Testing

- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage (must meet 80% threshold)
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:debug` - Run tests in debug mode

### Code Quality

- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run markdown:lint` - Lint markdown files
- `npm run security:secrets` - Scan for secrets using detect-secrets
- `npm run security:audit` - Run npm security audit
- `npm run license:check` - Check dependency licenses

## Architecture

### Framework & Structure

- **NestJS** TypeScript framework with modular architecture
- **PostgreSQL** database with Prisma ORM
- **Microservice** designed for meal plan management within a larger Recipe Web App ecosystem
- **Global prefix**: All API endpoints use `api/v1` prefix
- **Swagger documentation** available at `/docs` endpoint

### Key Components

#### Configuration System

- Environment-based configuration in `src/config/configuration.ts`
- Joi validation schema for environment variables
- TypeScript interfaces for type-safe config access
- Supports multiple config types: app, database, JWT, Redis, rate limiting, external services

#### Path Aliases (TypeScript)

```typescript
"@/*": ["src/*"]
"@config/*": ["src/config/*"]
"@modules/*": ["src/modules/*"]
"@shared/*": ["src/shared/*"]
"@utils/*": ["src/utils/*"]
```

#### Global Middleware & Interceptors

- **Helmet** for security headers
- **CORS** with configurable origins
- **ValidationPipe** with transformation and whitelisting
- **HttpExceptionFilter** for consistent error responses
- **ResponseInterceptor** for standardized API response format
- **CorrelationIdInterceptor** for request tracing
- **ThrottlerModule** with multiple rate limiting tiers (short/medium/long)

#### Database

- Prisma Client with PostgreSQL
- PrismaService configured with lifecycle management
- Schema references external database (defined in main database repository)
- Connection managed through DATABASE_URL environment variable

#### Logging

- Winston logger with configurable levels
- Structured logging with correlation IDs
- Environment-specific configuration

### Module Structure

- `src/modules/health/` - Health check endpoints for monitoring
- Modular design ready for meal plan management features
- Each module follows NestJS conventions with controller/service/module files

### Security Features

- JWT authentication support (configured but not yet implemented)
- Rate limiting with multiple tiers
- Helmet security headers
- Input validation and sanitization
- Secret scanning in CI/CD

## Quality Standards

### Code Coverage

Minimum 80% coverage required for:

- Branches
- Functions
- Lines
- Statements

### ESLint Rules

Strict TypeScript configuration with:

- No explicit `any` types
- Mandatory floating promise handling
- Unsafe operation prevention
- Nullish coalescing and optional chaining preferences
- Console usage warnings (use Winston logger instead)
