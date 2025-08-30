import { PrismaService } from '@/config/database.config';
import { TransactionService } from '../transaction.service';
import { DatabaseSeeder } from './database-seeder';
import { UserFactory, RecipeFactory, MealPlanFactory } from './factories';
import { LoggerService } from '@/shared/services/logger.service';

export interface TestDatabaseOptions {
  prisma: PrismaService;
  logger?: LoggerService;
}

export class TestDatabase {
  private seeder: DatabaseSeeder;
  private transactionService: TransactionService;

  constructor(private readonly options: TestDatabaseOptions) {
    this.transactionService = new TransactionService(options.prisma);
    this.seeder = new DatabaseSeeder(options.prisma, this.transactionService);
  }

  async setup(): Promise<void> {
    await this.seeder.cleanDatabase();
  }

  async cleanup(): Promise<void> {
    await this.seeder.cleanDatabase();
  }

  async createUser(overrides = {}) {
    const userData = UserFactory.build(overrides);
    return this.options.prisma.user.create({ data: userData });
  }

  async createUsers(count: number, overrides = {}) {
    const usersData = UserFactory.createMany(count).map((data) =>
      UserFactory.build({ ...data, ...overrides }),
    );
    return Promise.all(usersData.map((data) => this.options.prisma.user.create({ data })));
  }

  async createRecipe(overrides = {}) {
    const recipeData = RecipeFactory.build(overrides);
    return this.options.prisma.recipe.create({ data: recipeData });
  }

  async createRecipes(count: number, overrides = {}) {
    const recipesData = RecipeFactory.createMany(count).map((data) =>
      RecipeFactory.build({ ...data, ...overrides }),
    );
    return Promise.all(recipesData.map((data) => this.options.prisma.recipe.create({ data })));
  }

  async createMealPlan(overrides = {}) {
    const mealPlanData = MealPlanFactory.build(overrides);
    return this.options.prisma.mealPlan.create({ data: mealPlanData });
  }

  async createMealPlanWithRecipes(
    userId: string,
    recipeIds: string[],
    options: {
      name?: string;
      startDate?: Date;
      daysCount?: number;
    } = {},
  ) {
    return this.seeder.seedMealPlanForUser(userId, recipeIds, options);
  }

  async createMealPlanRecipe(overrides = {}) {
    const recipeData = MealPlanFactory.createRecipe(overrides);
    return this.options.prisma.mealPlanRecipe.create({
      data: {
        mealPlanId: BigInt(recipeData.mealPlanId!),
        recipeId: BigInt(recipeData.recipeId!),
        mealDate: recipeData.plannedDate!,
        mealType: recipeData.mealType!,
      },
    });
  }

  async seedTestData(options = {}) {
    return this.seeder.seedAll({
      users: 3,
      recipes: 10,
      mealPlans: 2,
      recipesPerPlan: 5,
      cleanFirst: false,
      ...options,
    });
  }

  get factories() {
    return {
      user: UserFactory,
      recipe: RecipeFactory,
      mealPlan: MealPlanFactory,
    };
  }

  get prisma() {
    return this.options.prisma;
  }
}
