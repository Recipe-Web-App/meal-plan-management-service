# Database Integration Guide

This document provides comprehensive guidance for setting up and working with the database integration in the Meal Plan Management Service.

> **Note**: This service also includes a comprehensive OAuth2 authentication system. For authentication setup and configuration, see [AUTHENTICATION.md](./AUTHENTICATION.md).

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
- Node.js 18+
- npm or yarn package manager

### Required Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/meal_plan_management"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="meal_plan_management"
MEAL_PLAN_MANAGEMENT_DB_USER="your_username"
MEAL_PLAN_MANAGEMENT_DB_PASSWORD="your_password"

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

```
postgresql://[user[:password]@][host[:port]][/database][?parameter_list]
```

Examples:

- Local development: `postgresql://dev_user:dev_pass@localhost:5432/meal_plan_dev`
- Production: `postgresql://prod_user:secure_pass@db-host:5432/meal_plan_prod`
- With SSL: `postgresql://user:pass@host:5432/db?sslmode=require`

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
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["recipe_manager"]
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  mealPlans MealPlan[]

  @@schema("recipe_manager")
}

model Recipe {
  id           String    @id @default(uuid())
  title        String
  description  String?
  cookingTime  Int?
  servings     Int?
  difficulty   String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  mealPlanRecipes MealPlanRecipe[]

  @@schema("recipe_manager")
}

model MealPlan {
  id          String   @id @default(uuid())
  userId      String
  name        String
  description String?
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user    User             @relation(fields: [userId], references: [id])
  recipes MealPlanRecipe[]

  @@schema("recipe_manager")
}

model MealPlanRecipe {
  id           String    @id @default(uuid())
  mealPlanId   String
  recipeId     String
  plannedDate  DateTime
  mealType     MealType
  servings     Int       @default(1)
  notes        String?
  createdAt    DateTime  @default(now())

  mealPlan MealPlan @relation(fields: [mealPlanId], references: [id])
  recipe   Recipe   @relation(fields: [recipeId], references: [id])

  @@schema("recipe_manager")
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK

  @@schema("recipe_manager")
}
```

### Generating Prisma Client

After schema changes, regenerate the Prisma client:

```bash
npx prisma generate
```

### Database Migrations

For production deployments:

```bash
npx prisma migrate deploy
```

For development with migration files:

```bash
npx prisma migrate dev --name migration_name
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
    return this.transactionService.executeInTransaction(async (tx) => {
      // Create meal plan
      const mealPlan = await this.mealPlansRepo.create(data.mealPlan, tx);

      // Add recipes
      await this.mealPlansRepo.addMultipleRecipes(mealPlan.id, data.recipes, tx);

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
  return this.transactionService.batchProcess(
    mealPlansData,
    async (batch, tx) => {
      return Promise.all(
        batch.map(data => this.mealPlansRepo.create(data, tx))
      );
    },
    5 // batch size
  );
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
   npm install
   ```

2. **Set Environment Variables**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

4. **Run Database Migrations** (if using migrations)
   ```bash
   npx prisma migrate deploy
   ```

### Development Data Seeding

For development with test data:

```bash
# Using npm scripts (if available)
npm run db:seed

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
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Schema Changes

1. **Update Prisma Schema**

   ```bash
   # Edit prisma/schema.prisma
   ```

2. **Generate Migration** (optional)

   ```bash
   npx prisma migrate dev --name add_new_field
   ```

3. **Regenerate Client**

   ```bash
   npx prisma generate
   ```

4. **Update TypeScript Types**
   ```bash
   npm run build
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
npx prisma migrate reset

# Or manually resolve conflicts
npx prisma db push --force-reset
```

#### Schema Generation Issues

**Problem**: Prisma client generation fails
**Solution**:

```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
npx prisma generate --force
```

### Performance Optimization

#### Connection Pooling

Adjust connection pool settings in the database URL:

```
postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
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
