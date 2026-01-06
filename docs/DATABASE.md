# Database Integration Guide

This document provides comprehensive guidance for setting up and working with the database integration in the
Meal Plan Management Service.

> **Note**: This service also includes a comprehensive OAuth2 authentication system. For authentication setup and
> configuration, see [AUTHENTICATION.md](./AUTHENTICATION.md).

## Table of Contents

- [Overview](#overview)
- [Environment Setup](#environment-setup)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [Repository Pattern](#repository-pattern)
- [Transaction Management](#transaction-management)
- [Connection Management](#connection-management)
- [Seeding and Testing](#seeding-and-testing)
- [Development Workflows](#development-workflows)
- [Troubleshooting](#troubleshooting)

## Overview

The service uses **Prisma ORM** with **PostgreSQL** and implements the following patterns:

- **Repository Pattern** for data access abstraction
- **Transaction Management** with retry logic
- **Connection Pooling** with health monitoring
- **Seeding Utilities** for development and testing
- **Multi-schema Support** for shared database resources

## Environment Setup

### Prerequisites

- PostgreSQL 12+ running locally or accessible remotely
- Bun runtime (or Node.js 18+)

### Required Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/meal_plan_management" # pragma: allowlist secret
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="meal_plan_management"
MEAL_PLAN_MANAGEMENT_DB_USER="your_username"
MEAL_PLAN_MANAGEMENT_DB_PASSWORD="your_password" # pragma: allowlist secret

# Database Behavior
DATABASE_MAX_RETRIES="5"
DATABASE_RETRY_DELAY="5000"
DATABASE_HEALTH_CHECK_INTERVAL="30000"
DATABASE_LOG_QUERIES="true"

# Application
NODE_ENV="development"
PORT="3000"
```

### Database URL Format

The `DATABASE_URL` follows PostgreSQL connection string format:

```text
postgresql://[user[:password]@][host[:port]][/database][?parameter_list]
```

Examples:

- Local development: `postgresql://dev_user:dev_pass@localhost:5432/meal_plan_dev` <!-- pragma: allowlist secret -->
- Production: `postgresql://prod_user:secure_pass@db-host:5432/meal_plan_prod` <!-- pragma: allowlist secret -->
- With SSL: `postgresql://user:pass@host:5432/db?sslmode=require` <!-- pragma: allowlist secret -->

## Configuration

### Database Configuration Options

The service supports the following database configuration options:

| Option                | Default       | Description                          |
| --------------------- | ------------- | ------------------------------------ |
| `maxRetries`          | 5             | Maximum connection retry attempts    |
| `retryDelay`          | 5000ms        | Delay between retry attempts         |
| `healthCheckInterval` | 30000ms       | Health check interval (0 to disable) |
| `logQueries`          | `true` in dev | Whether to log database queries      |

### Configuration File

Database configuration is defined in `src/config/configuration.ts`:

```typescript
database: {
  url: process.env.DATABASE_URL!,
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT!, 10) || 5432,
  database: process.env.POSTGRES_DB!,
  username: process.env.MEAL_PLAN_MANAGEMENT_DB_USER!,
  password: process.env.MEAL_PLAN_MANAGEMENT_DB_PASSWORD!,
  maxRetries: parseInt(process.env.DATABASE_MAX_RETRIES!, 10) || 5,
  retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY!, 10) || 5000,
  healthCheckInterval: parseInt(process.env.DATABASE_HEALTH_CHECK_INTERVAL!, 10) || 30000,
  logQueries: process.env.DATABASE_LOG_QUERIES === 'true' || process.env.NODE_ENV === 'development',
}
```

## Database Schema

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
  schemas  = ["recipe_manager"]
}

// Enums
enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
  DESSERT

  @@map("meal_type_enum")
  @@schema("recipe_manager")
}

// Minimal User model - only fields needed for meal plan relationships
model User {
  userId            String             @id @map("user_id") @db.Uuid
  username          String             @unique @db.VarChar(50)
  mealPlans         MealPlan[]
  mealPlanFavorites MealPlanFavorite[]

  @@map("users")
  @@schema("recipe_manager")
}

// Minimal Recipe model - only fields needed for meal plan relationships
model Recipe {
  recipeId        BigInt           @id @default(autoincrement()) @map("recipe_id")
  userId          String           @map("user_id") @db.Uuid
  title           String           @db.VarChar(255)
  mealPlanRecipes MealPlanRecipe[]

  @@map("recipes")
  @@schema("recipe_manager")
}

// MealPlan model
model MealPlan {
  mealPlanId  BigInt    @id @default(autoincrement()) @map("meal_plan_id")
  userId      String    @map("user_id") @db.Uuid
  name        String    @db.VarChar(255)
  description String?   @db.Text
  startDate   DateTime? @map("start_date") @db.Date
  endDate     DateTime? @map("end_date") @db.Date
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  user                 User                  @relation(fields: [userId], references: [userId], onDelete: Cascade)
  mealPlanRecipes      MealPlanRecipe[]
  mealPlanFavorites    MealPlanFavorite[]
  mealPlanTagJunctions MealPlanTagJunction[]

  @@map("meal_plans")
  @@schema("recipe_manager")
}

// MealPlanRecipe junction model
model MealPlanRecipe {
  mealPlanId BigInt   @map("meal_plan_id")
  recipeId   BigInt   @map("recipe_id")
  mealDate   DateTime @map("meal_date") @db.Date
  mealType   MealType @map("meal_type")

  mealPlan MealPlan @relation(fields: [mealPlanId], references: [mealPlanId], onDelete: Cascade)
  recipe   Recipe   @relation(fields: [recipeId], references: [recipeId], onDelete: Cascade)

  @@id([mealPlanId, recipeId, mealDate])
  @@map("meal_plan_recipes")
  @@schema("recipe_manager")
}

// MealPlanFavorite junction model
model MealPlanFavorite {
  userId      String   @map("user_id") @db.Uuid
  mealPlanId  BigInt   @map("meal_plan_id")
  favoritedAt DateTime @default(now()) @map("favorited_at") @db.Timestamptz(6)

  user     User     @relation(fields: [userId], references: [userId], onDelete: Cascade)
  mealPlan MealPlan @relation(fields: [mealPlanId], references: [mealPlanId], onDelete: Cascade)

  @@id([userId, mealPlanId])
  @@map("meal_plan_favorites")
  @@schema("recipe_manager")
}

// MealPlanTag model
model MealPlanTag {
  tagId BigInt @id @default(autoincrement()) @map("tag_id")
  name  String @unique @db.VarChar(50)

  mealPlanTagJunctions MealPlanTagJunction[]

  @@map("meal_plan_tags")
  @@schema("recipe_manager")
}

// MealPlanTagJunction model
model MealPlanTagJunction {
  mealPlanId BigInt @map("meal_plan_id")
  tagId      BigInt @map("tag_id")

  mealPlan MealPlan    @relation(fields: [mealPlanId], references: [mealPlanId], onDelete: Cascade)
  tag      MealPlanTag @relation(fields: [tagId], references: [tagId], onDelete: Cascade)

  @@id([mealPlanId, tagId])
  @@map("meal_plan_tag_junction")
  @@schema("recipe_manager")
}
```

### Generating Prisma Client

After schema changes, regenerate the Prisma client:

```bash
bunx prisma generate
```

### Database Migrations

For production deployments:

```bash
bunx prisma migrate deploy
```

For development with migration files:

```bash
bunx prisma migrate dev --name migration_name
```

## Repository Pattern

### Using the Repository

The `MealPlansRepository` provides a clean abstraction over database operations:

```typescript
import { MealPlansRepository } from '@/modules/meal-plans/meal-plans.repository';

@Injectable()
export class MealPlanService {
  constructor(private readonly mealPlansRepo: MealPlansRepository) {}

  async createMealPlan(userId: string, data: CreateMealPlanData) {
    return this.mealPlansRepo.create({
      userId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: true,
    });
  }

  async getMealPlansForUser(userId: string) {
    return this.mealPlansRepo.findManyByUserId(userId);
  }
}
```

### Available Repository Methods

#### Basic CRUD Operations

- `create(data)` - Create a new meal plan
- `findById(id)` - Find meal plan by ID
- `findMany(options)` - Find multiple meal plans with filtering
- `update(id, data)` - Update meal plan
- `delete(id)` - Delete meal plan

#### Specialized Operations

- `findManyByUserId(userId)` - Get all meal plans for a user
- `findActiveForUser(userId)` - Get active meal plans for a user
- `findByDateRange(userId, startDate, endDate)` - Find meal plans in date range
- `createWithRecipes(data, tx?)` - Create meal plan with recipes in transaction
- `addMultipleRecipes(mealPlanId, recipes, tx?)` - Add multiple recipes
- `cloneMealPlan(mealPlanId, newData, tx?)` - Clone existing meal plan

## Transaction Management

### Using Transactions

The `TransactionService` provides transaction management with retry logic:

```typescript
import { TransactionService } from '@/shared/database/transaction.service';

@Injectable()
export class MealPlanService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly mealPlansRepo: MealPlansRepository,
  ) {}

  async createMealPlanWithRecipes(data: CreateMealPlanWithRecipesData) {
    return this.transactionService.executeTransaction(async (tx) => {
      // Create meal plan
      const mealPlan = await this.mealPlansRepo.create(data.mealPlan, tx);

      // Add recipes
      await this.mealPlansRepo.addMultipleRecipes(mealPlan.mealPlanId, data.recipes, tx);

      return mealPlan;
    });
  }
}
```

### Transaction with Retry Logic

For operations that may fail due to temporary issues:

```typescript
async createRobustMealPlan(data: any) {
  return this.transactionService.retryTransaction(
    async (tx) => {
      // Your transactional operations here
      const mealPlan = await this.mealPlansRepo.create(data, tx);
      return mealPlan;
    },
    3, // max retries
    1000 // base delay in ms
  );
}
```

### Batch Operations

Process multiple operations efficiently:

```typescript
async processMealPlans(mealPlansData: any[]) {
  // Execute multiple operations in a single transaction
  const operations = mealPlansData.map(data =>
    (tx: TransactionClient) => this.mealPlansRepo.create(data, tx)
  );

  return this.transactionService.executeBatch(operations);
}

// Or use executeParallel for concurrent execution (use with caution)
async processMealPlansParallel(mealPlansData: any[]) {
  const operations = mealPlansData.map(data =>
    (tx: TransactionClient) => this.mealPlansRepo.create(data, tx)
  );

  return this.transactionService.executeParallel(operations);
}
```

## Connection Management

### Database Health Monitoring

The `ConnectionService` provides connection monitoring and management:

```typescript
import { ConnectionService } from '@/shared/database/connection.service';

@Injectable()
export class HealthController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Get('database')
  async getDatabaseStatus() {
    const metrics = await this.connectionService.getDatabaseMetrics();
    return {
      status: metrics.healthStatus.status,
      latency: metrics.healthStatus.latency,
      uptime: metrics.uptime,
      connected: metrics.connectionStatus.isConnected,
    };
  }
}
```

### Manual Connection Management

Force reconnection when needed:

```typescript
async handleConnectionIssue() {
  try {
    await this.connectionService.forceReconnect();
    console.log('Reconnection successful');
  } catch (error) {
    console.error('Reconnection failed:', error);
  }
}
```

### Connection Testing

Test database connectivity with custom queries:

```typescript
async testDatabaseConnectivity() {
  const result = await this.connectionService.testConnection(
    'SELECT COUNT(*) as total FROM meal_plans'
  );

  if (result.success) {
    console.log(`Query executed in ${result.latency}ms`);
  } else {
    console.error('Query failed:', result.error);
  }
}
```

## Seeding and Testing

### Using Factory Classes

Generate test data with factory classes:

```typescript
import { UserFactory, RecipeFactory, MealPlanFactory } from '@/shared/database/seed/factories';

// Create individual entities
const userData = UserFactory.create({
  name: 'John Doe',
  email: 'john@example.com',
});

const recipeData = RecipeFactory.createBreakfastRecipe({
  title: 'Pancakes',
  cookingTime: 15,
});

const mealPlanData = MealPlanFactory.createActiveWeekly(userId);
```

### Database Seeding

Use the `DatabaseSeeder` for comprehensive data seeding:

```typescript
import { DatabaseSeeder } from '@/shared/database/seed/database-seeder';

@Injectable()
export class SeedCommand {
  constructor(private readonly seeder: DatabaseSeeder) {}

  async seedDevelopmentData() {
    const result = await this.seeder.seedAll({
      users: 10,
      recipes: 50,
      mealPlans: 5,
      recipesPerPlan: 15,
      cleanFirst: true,
    });

    console.log(
      `Seeded ${result.users} users, ${result.recipes} recipes, ${result.mealPlans} meal plans`,
    );
  }
}
```

### Test Database Setup

Use `TestDatabase` class in tests:

```typescript
import { TestDatabase } from '@/shared/database/seed/test-database';

describe('MealPlan Integration Tests', () => {
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = new TestDatabase({ prisma: prismaService });
    await testDb.setup(); // Clean database
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  it('should create meal plan with recipes', async () => {
    // Create test data
    const user = await testDb.createUser({ name: 'Test User' });
    const recipes = await testDb.createRecipes(3);

    // Create meal plan with recipes
    const result = await testDb.createMealPlanWithRecipes(
      user.id,
      recipes.map((r) => r.id),
      { name: 'Test Plan', daysCount: 3 },
    );

    expect(result.recipesAdded).toBe(3);
  });
});
```

## Development Workflows

### Initial Database Setup

1. **Install Dependencies**

   ```bash
   bun install
   ```

2. **Set Environment Variables**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Generate Prisma Client**

   ```bash
   bunx prisma generate
   ```

4. **Run Database Migrations** (if using migrations)

   ```bash
   bunx prisma migrate deploy
   ```

### Development Data Seeding

For development with test data:

```bash
# Using bun scripts (if available)
bun run db:seed

# Or using the seeder service directly
node -e "
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
(async () => {
  const app = await NestFactory.create(AppModule);
  const seeder = app.get('DatabaseSeeder');
  await seeder.seedAll({ users: 5, recipes: 20, mealPlans: 3 });
  await app.close();
})();
"
```

### Running Tests

```bash
# Unit tests
bun test

# Integration tests
bun test test/**/*.e2e-spec.ts

# Test coverage
bun test --coverage
```

### Database Schema Changes

1. **Update Prisma Schema**

   ```bash
   # Edit prisma/schema.prisma
   ```

2. **Generate Migration** (optional)

   ```bash
   bunx prisma migrate dev --name add_new_field
   ```

3. **Regenerate Client**

   ```bash
   bunx prisma generate
   ```

4. **Update TypeScript Types**

   ```bash
   bun run build
   ```

## Troubleshooting

### Common Issues

#### Connection Timeouts

**Problem**: Database connection timeouts
**Solution**:

- Check `DATABASE_MAX_RETRIES` and `DATABASE_RETRY_DELAY` settings
- Verify database server is accessible
- Check network connectivity and firewall settings

#### Migration Errors

**Problem**: Prisma migration failures
**Solution**:

```bash
# Reset database (development only)
bunx prisma migrate reset

# Or manually resolve conflicts
bunx prisma db push --force-reset
```

#### Schema Generation Issues

**Problem**: Prisma client generation fails
**Solution**:

```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
bunx prisma generate --force
```

### Performance Optimization

#### Connection Pooling

Adjust connection pool settings in the database URL:

```text
postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10  # pragma: allowlist secret
```

#### Query Optimization

Enable query logging to identify slow queries:

```env
DATABASE_LOG_QUERIES="true"
```

#### Health Check Tuning

Adjust health check frequency for production:

```env
DATABASE_HEALTH_CHECK_INTERVAL="60000"  # 60 seconds
```

### Monitoring and Logging

#### Database Metrics

Monitor database health through the `/health` endpoint:

```bash
curl http://localhost:3000/api/v1/health
```

#### Query Logging

Enable query logging in development:

```env
DATABASE_LOG_QUERIES="true"
LOG_LEVEL="debug"
```

#### Error Tracking

Database errors are automatically logged through the Winston logger with correlation IDs for request tracing.

### Production Deployment

#### Environment Variables

Ensure all required environment variables are set:

- `DATABASE_URL` - Production database connection string
- `DATABASE_LOG_QUERIES="false"` - Disable query logging
- `DATABASE_HEALTH_CHECK_INTERVAL="30000"` - Health check interval

#### Security Considerations

- Use strong database passwords
- Enable SSL connections: `?sslmode=require`
- Restrict database user permissions
- Use connection pooling to prevent connection exhaustion
- Monitor database performance and connection counts

#### Backup Strategy

Implement regular database backups:

```bash
# Example backup command
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Support

For additional help:

- Check the [NestJS Prisma documentation](https://docs.nestjs.com/recipes/prisma)
- Review [Prisma documentation](https://www.prisma.io/docs)
- Consult the project's issue tracker for known problems
