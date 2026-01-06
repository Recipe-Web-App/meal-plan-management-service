# Database Quick Reference

Quick commands and code snippets for common database operations.

> **Related**: [AUTHENTICATION.md](./AUTHENTICATION.md) for OAuth2 authentication setup.

## Setup Commands

```bash
# Install dependencies
bun install

# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate deploy

# Development with test data
bun run db:seed  # if available
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/meal_plan_management" # pragma: allowlist secret
DATABASE_MAX_RETRIES="5"
DATABASE_RETRY_DELAY="5000"
DATABASE_HEALTH_CHECK_INTERVAL="30000"
DATABASE_LOG_QUERIES="true"
```

## Repository Usage

### Basic Operations

```typescript
// Inject repository
constructor(private readonly mealPlansRepo: MealPlansRepository) {}

// Create
const mealPlan = await this.mealPlansRepo.create({
  userId: 'user-123',
  name: 'Weekly Plan',
  startDate: new Date(),
  endDate: new Date(),
});

// Find by ID
const mealPlan = await this.mealPlansRepo.findById('plan-123');

// Find by user
const userPlans = await this.mealPlansRepo.findManyByUserId('user-123');

// Update
const updated = await this.mealPlansRepo.update('plan-123', {
  name: 'Updated Plan Name',
});

// Delete
await this.mealPlansRepo.delete('plan-123');
```

### Complex Operations

```typescript
// Create with recipes
const mealPlan = await this.mealPlansRepo.createWithRecipes({
  mealPlan: {
    userId: 'user-123',
    name: 'Plan with Recipes',
    startDate: new Date(),
    endDate: new Date(),
  },
  recipes: [
    { recipeId: 'recipe-1', plannedDate: new Date(), mealType: 'BREAKFAST' },
    { recipeId: 'recipe-2', plannedDate: new Date(), mealType: 'LUNCH' },
  ],
});

// Clone meal plan
const cloned = await this.mealPlansRepo.cloneMealPlan('existing-plan-id', {
  name: 'Cloned Plan',
  startDate: new Date(),
});
```

## Transactions

### Simple Transaction

```typescript
import { TransactionService } from '@/shared/database/transaction.service';

// Inject service
constructor(private readonly transactionService: TransactionService) {}

// Execute in transaction
const result = await this.transactionService.executeTransaction(async (tx) => {
  const mealPlan = await this.mealPlansRepo.create(planData, tx);
  await this.mealPlansRepo.addMultipleRecipes(mealPlan.mealPlanId, recipes, tx);
  return mealPlan;
});
```

### Retry Transaction

```typescript
// Transaction with retry logic
const result = await this.transactionService.retryTransaction(
  async (tx) => {
    // Your operations
    return await this.mealPlansRepo.create(data, tx);
  },
  3, // max retries
  1000, // base delay
);
```

### Batch Processing

```typescript
// Execute multiple operations in a single transaction
const operations = largeDataArray.map(
  (item) => (tx: TransactionClient) => this.mealPlansRepo.create(item, tx),
);
const results = await this.transactionService.executeBatch(operations);

// Or use executeParallel for concurrent execution (use with caution)
const parallelResults = await this.transactionService.executeParallel(operations);
```

## Connection Management

```typescript
import { ConnectionService } from '@/shared/database/connection.service';

// Get database metrics
const metrics = await this.connectionService.getDatabaseMetrics();
console.log(`Health: ${metrics.healthStatus.status}`);
console.log(`Latency: ${metrics.healthStatus.latency}ms`);
console.log(`Uptime: ${metrics.uptime}ms`);

// Force reconnection
await this.connectionService.forceReconnect();

// Test connection
const test = await this.connectionService.testConnection();
if (test.success) {
  console.log(`Connection OK (${test.latency}ms)`);
} else {
  console.error(`Connection failed: ${test.error}`);
}
```

## Factory Usage

### Create Test Data

```typescript
import { UserFactory, RecipeFactory, MealPlanFactory } from '@/shared/database/seed/factories';

// Single entities
const user = UserFactory.create({ name: 'John Doe', email: 'john@example.com' });
const recipe = RecipeFactory.createBreakfastRecipe({ title: 'Pancakes' });
const plan = MealPlanFactory.createActiveWeekly('user-123');

// Multiple entities
const users = UserFactory.createMany(5);
const recipes = RecipeFactory.createMany(10);
const planRecipes = MealPlanFactory.createManyRecipes(7);

// Build for database (excludes optional fields)
const userData = UserFactory.build({ name: 'Test User' });
await prisma.user.create({ data: userData });
```

### Specialized Factories

```typescript
// Breakfast recipe
const breakfast = RecipeFactory.createBreakfastRecipe({
  title: 'Overnight Oats',
  cookingTime: 5,
  difficulty: 'Easy',
});

// Dinner recipe
const dinner = RecipeFactory.createDinnerRecipe({
  title: 'Pasta Carbonara',
  servings: 4,
});

// Weekly meal plan
const weekPlan = MealPlanFactory.createActiveWeekly('user-123', {
  name: 'My Weekly Plan',
});

// Week of meals
const meals = MealPlanFactory.createWeekOfMeals('plan-123', recipeIds, new Date());
```

## Database Seeder

### Full Seeding

```typescript
import { DatabaseSeeder } from '@/shared/database/seed/database-seeder';

// Comprehensive seeding
const result = await this.seeder.seedAll({
  users: 10,
  recipes: 50,
  mealPlans: 5,
  recipesPerPlan: 15,
  cleanFirst: true, // Clean database first
});

console.log(`Created:
  Users: ${result.users}
  Recipes: ${result.recipes}
  Meal Plans: ${result.mealPlans}
  Plan Recipes: ${result.mealPlanRecipes}
  Duration: ${result.duration}ms
`);
```

### Targeted Seeding

```typescript
// Seed specific entities
const users = await this.seeder.seedUsers(5);
const recipes = await this.seeder.seedRecipes(20);

// Seed meal plan for specific user
const planResult = await this.seeder.seedMealPlanForUser('user-123', recipeIds, {
  name: 'Custom Plan',
  startDate: new Date(),
  daysCount: 7,
});

// Clean database
await this.seeder.cleanDatabase();
```

## Test Database

### Setup in Tests

```typescript
import { TestDatabase } from '@/shared/database/seed/test-database';

describe('Integration Test', () => {
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = new TestDatabase({ prisma: prismaService });
    await testDb.setup(); // Cleans database
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  it('should work with test data', async () => {
    // Create entities
    const user = await testDb.createUser();
    const recipes = await testDb.createRecipes(3);
    const mealPlan = await testDb.createMealPlan({ userId: user.id });

    // Create complex scenarios
    const planWithRecipes = await testDb.createMealPlanWithRecipes(
      user.id,
      recipes.map((r) => r.id),
      { name: 'Test Plan', daysCount: 3 },
    );

    // Seed bulk data
    const seedResult = await testDb.seedTestData({
      users: 2,
      recipes: 5,
      cleanFirst: false,
    });

    // Access factories
    const newUser = testDb.factories.user.create();
    const newRecipe = testDb.factories.recipe.createBreakfastRecipe();
  });
});
```

## Health Monitoring

### Health Check Endpoint Response

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "message": "Database connection is healthy",
      "latency": 25,
      "connected": true,
      "connectionRetries": 0,
      "timestamp": "2025-08-29T17:35:00.000Z"
    },
    "memory_heap": { "status": "up" },
    "disk": { "status": "up" }
  }
}
```

### Manual Health Check

```bash
# Check application health
curl http://localhost:3000/api/v1/health

# Check readiness (database connectivity)
curl http://localhost:3000/api/v1/health/readiness

# Check liveness (basic service health)
curl http://localhost:3000/api/v1/health/liveness
```

## Debugging

### Enable Query Logging

```env
DATABASE_LOG_QUERIES="true"
LOG_LEVEL="debug"
```

### Connection Issues

```typescript
// Check connection status
const status = this.connectionService.getConnectionStatus();
console.log('Connected:', status.isConnected);
console.log('Retries:', status.connectionRetries);
console.log('Max Retries:', status.maxRetries);

// Validate configuration
const validation = this.connectionService.validateConfiguration();
if (!validation.valid) {
  console.error('Config issues:', validation.issues);
}

// Get masked connection URL (safe for logging)
const maskedUrl = this.connectionService.getMaskedConnectionUrl();
console.log('Database URL:', maskedUrl);
```

### Performance Monitoring

```typescript
// Execute with retry monitoring
const result = await this.connectionService.executeWithRetry(
  async () => {
    // Your database operation
    return await this.mealPlansRepo.findById('plan-123');
  },
  3, // max retries
  1000, // delay
);
```

## Common Patterns

### Service with Repository and Transactions

```typescript
@Injectable()
export class MealPlanService {
  constructor(
    private readonly mealPlansRepo: MealPlansRepository,
    private readonly transactionService: TransactionService,
  ) {}

  async createCompleteMealPlan(data: CreateCompleteData) {
    return this.transactionService.executeTransaction(async (tx) => {
      // Create meal plan
      const mealPlan = await this.mealPlansRepo.create(data.mealPlan, tx);

      // Add recipes
      if (data.recipes?.length) {
        await this.mealPlansRepo.addMultipleRecipes(mealPlan.mealPlanId, data.recipes, tx);
      }

      // Return with recipes
      return this.mealPlansRepo.findByIdWithRecipes(mealPlan.mealPlanId, tx);
    });
  }

  async bulkUpdateMealPlans(updates: UpdateData[]) {
    const operations = updates.map(
      (update) => (tx: TransactionClient) => this.mealPlansRepo.update(update.id, update.data, tx),
    );
    return this.transactionService.executeBatch(operations);
  }
}
```

### Error Handling

```typescript
async safeOperation() {
  try {
    return await this.mealPlansRepo.findById('plan-123');
  } catch (error) {
    if (this.isConnectionError(error)) {
      // Attempt reconnection
      await this.connectionService.forceReconnect();
      // Retry operation
      return this.mealPlansRepo.findById('plan-123');
    }
    throw error; // Re-throw non-connection errors
  }
}

private isConnectionError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  return ['connection', 'timeout', 'network'].some(
    pattern => message.includes(pattern)
  );
}
```
