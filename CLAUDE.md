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
- Supports multiple config types: app, database, JWT, OAuth2, Redis, rate limiting, external services

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

- **Prisma Client** with PostgreSQL and multi-schema support
- **Repository Pattern** for data access abstraction (`MealPlansRepository`)
- **Transaction Management** with retry logic and batch operations (`TransactionService`)
- **Connection Pooling** with health monitoring and automatic reconnection (`PrismaService`)
- **Seeding Utilities** for development and testing (`DatabaseSeeder`, factories)
- **Health Monitoring** with periodic checks and metrics collection
- Schema references shared `recipe_manager` schema for recipes and users
- Comprehensive error handling with connection retry logic
- Development tools: factories, test database utilities, and migration support

**Database Documentation:**

- [Complete Database Guide](./docs/DATABASE.md) - Comprehensive setup and usage documentation
- [Quick Reference](./docs/DATABASE_QUICK_REFERENCE.md) - Commands and code snippets
- [Setup Guide](./docs/DATABASE_SETUP.md) - Step-by-step installation instructions

#### Authentication System

- **OAuth2 with JWT** using passport-jwt strategy
- **Service-to-Service Authentication** with client credentials flow
- **Token Validation** supporting both local JWT validation and remote introspection
- **Security Guards** (`JwtAuthGuard`, `ServiceAuthGuard`) for endpoint protection
- **Token Caching** with configurable TTL for performance optimization
- **Flexible Configuration** for different deployment environments

**Authentication Documentation:**

- [Complete Authentication Guide](./docs/AUTHENTICATION.md) - Comprehensive setup and usage documentation

#### Logging

- Winston logger with configurable levels
- Structured logging with correlation IDs
- Environment-specific configuration

### Module Structure

- `src/modules/auth/` - Complete OAuth2 authentication system with guards, strategies, and services
- `src/modules/health/` - Health check endpoints for monitoring
- `src/modules/meal-plans/` - Meal plan management with authentication-protected endpoints
- Each module follows NestJS conventions with controller/service/module files

### Security Features

- **OAuth2 Authentication** with JWT tokens and service-to-service support
- **Bearer Token Authentication** on all protected endpoints
- **Scope-based Authorization** for service permissions
- **Rate Limiting** with multiple tiers (default, create/update, delete)
- **Helmet Security Headers** and CORS protection
- **Input Validation** and sanitization with class-validator
- **Secret Scanning** in CI/CD pipeline
- **Request Correlation IDs** for security tracing

### Environment Variables

#### Core Application

```bash
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:3000,https://app.example.com
LOG_LEVEL=info
```

#### Database Configuration

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=meal_plan_management
MEAL_PLAN_MANAGEMENT_DB_USER=username
MEAL_PLAN_MANAGEMENT_DB_PASSWORD=password
DATABASE_MAX_RETRIES=5
DATABASE_RETRY_DELAY=5000
DATABASE_LONG_RETRY_DELAY=60000
DATABASE_ENABLE_CONTINUOUS_RETRY=true
DATABASE_HEALTH_CHECK_INTERVAL=30000
DATABASE_LOG_QUERIES=false
```

#### OAuth2 Authentication

```bash
# Core OAuth2 Configuration
OAUTH2_SERVICE_ENABLED=true
OAUTH2_SERVICE_TO_SERVICE_ENABLED=true
OAUTH2_INTROSPECTION_ENABLED=false
OAUTH2_CLIENT_ID=meal-plan-service
OAUTH2_CLIENT_SECRET=your-secret-key
OAUTH2_AUTH_BASE_URL=https://auth-service.local/api/v1/auth

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=1d
```

#### Redis Configuration

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional-password
```

#### Rate Limiting

```bash
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

#### Logging Configuration

```bash
LOG_LEVEL=info
LOG_CONSOLE_FORMAT=pretty
LOG_FILE_ENABLED=false
LOG_FILE_PATH=logs
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
LOG_FILE_DATE_PATTERN=YYYY-MM-DD
```

#### External Services

```bash
RECIPE_SERVICE_URL=https://recipe-service.local/api/v1
USER_SERVICE_URL=https://user-service.local/api/v1
```

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
