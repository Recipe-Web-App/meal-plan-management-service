# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Run

```bash
bun run build          # Build (includes tsc-alias for path resolution)
bun run start:dev      # Development with watch
bun run start:prod     # Production (uses Bun runtime)
```

### Testing

```bash
bun test                          # Run unit tests
bun test meal-plans.service.spec  # Run single test file
bun test --watch                  # Watch mode
bun test --coverage               # Coverage (80% threshold)
bun test test/**/*.e2e-spec.ts    # E2E tests
```

### Database (Prisma)

```bash
bunx prisma migrate dev     # Create/apply migrations
bunx prisma generate        # Generate Prisma Client
bunx prisma studio          # GUI for database
bunx prisma db seed         # Seed test data
```

### Code Quality

```bash
bun run lint          # ESLint with auto-fix
bun run format        # Prettier
bun run pre-commit    # Run all pre-commit hooks
```

### Git Hooks (pre-commit)

Pre-commit runs formatting, linting, type checking, build, tests, and security scans. Use `SKIP=bun-tests git commit` to skip tests during commit (they still run on push).

## Architecture

### Overview

NestJS microservice for meal plan management within the Recipe Web App ecosystem. Uses Bun runtime, PostgreSQL with Prisma, and OAuth2/JWT authentication.

- **API prefix**: `api/v1`
- **Swagger docs**: `/docs`

### Path Aliases

```typescript
"@/*"         → "src/*"
"@config/*"   → "src/config/*"
"@modules/*"  → "src/modules/*"
"@shared/*"   → "src/shared/*"
"@generated/*"→ "src/generated/*"
```

### Module Structure

Each feature module follows the pattern: `controller → service → repository`

- **meal-plans/** - Core CRUD with favorites and tags submodules
- **auth/** - OAuth2 + JWT authentication (guards, strategies, token validation)
- **health/** - Health check endpoints
- **metrics/** - Prometheus metrics
- **system/** - System info endpoints

### Shared Infrastructure (`src/shared/`)

The `SharedModule` is global and provides:

- **PrismaService** - Database connection with pooling, health monitoring, and retry logic
- **LoggerService** - Winston logger with correlation ID support
- **RequestContextService** - Request context tracking
- **HttpExceptionFilter** - Consistent error response format
- **ResponseInterceptor** - Standardized API response wrapper
- **CorrelationIdInterceptor** - Request tracing

### Database Schema

Uses PostgreSQL with multi-schema support. All tables are in the `recipe_manager` schema:

- `MealPlan` - Main entity with user, date range, and description
- `MealPlanRecipe` - Junction table linking plans to recipes (with meal type and date)
- `MealPlanFavorite` - User favorites
- `MealPlanTag` / `MealPlanTagJunction` - Tagging system

Prisma Client is generated to `src/generated/prisma`.

### Authentication

- **JwtAuthGuard** - Protects endpoints requiring user authentication
- **ServiceAuthGuard** - For service-to-service (client credentials) auth
- **@CurrentUser()** - Decorator to extract authenticated user from request

All endpoints except health checks require Bearer token authentication.

### Rate Limiting

Three tiers configured in `ThrottlerModule`:

- **short**: 3 requests/second
- **medium**: 20 requests/10 seconds
- **long**: Configurable (default 100/minute)

## Key Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/db  # pragma: allowlist secret
JWT_SECRET=your-secret
OAUTH2_CLIENT_ID=meal-plan-service
OAUTH2_CLIENT_SECRET=your-secret

# Optional with defaults
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

See `src/config/configuration.ts` and `src/config/env.validation.ts` for full configuration options.

## Code Quality Standards

- **Coverage thresholds**: 70% branches, 80% functions/lines/statements
- **No explicit `any` types** - use proper TypeScript types
- **No floating promises** - all promises must be handled
- **Use Winston logger** - not console.log
