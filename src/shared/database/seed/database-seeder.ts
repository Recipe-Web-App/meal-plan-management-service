/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/prefer-nullish-coalescing */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { TransactionService } from '../transaction.service';
import { UserFactory, RecipeFactory, MealPlanFactory } from './factories';
import { MealType } from '@prisma/client';

export interface SeedOptions {
  users?: number;
  recipes?: number;
  mealPlans?: number;
  recipesPerPlan?: number;
  cleanFirst?: boolean;
}

export interface SeedResult {
  users: number;
  recipes: number;
  mealPlans: number;
  mealPlanRecipes: number;
  duration: number;
}

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
  ) {}

  async seedAll(options: SeedOptions = {}): Promise<SeedResult> {
    const startTime = Date.now();
    const defaults = {
      users: 5,
      recipes: 20,
      mealPlans: 3,
      recipesPerPlan: 10,
      cleanFirst: true,
      ...options,
    };

    this.logger.log('Starting database seeding...', { options: defaults });

    try {
      return await this.transactionService.executeTransaction(async (tx) => {
        if (defaults.cleanFirst) {
          await this.cleanDatabase(tx);
        }

        // Seed users
        this.logger.log(`Creating ${defaults.users} users...`);
        const userData = UserFactory.createMany(defaults.users);
        const users = await Promise.all(
          userData.map((data) => tx.user.create({ data: UserFactory.build(data) })),
        );

        // Seed recipes
        this.logger.log(`Creating ${defaults.recipes} recipes...`);
        const recipeData = RecipeFactory.createMany(defaults.recipes);
        const recipes = await Promise.all(
          recipeData.map((data) => tx.recipe.create({ data: RecipeFactory.build(data) })),
        );

        // Seed meal plans with recipes
        this.logger.log(`Creating ${defaults.mealPlans} meal plans...`);
        let totalMealPlanRecipes = 0;

        for (const user of users) {
          const userMealPlansCount = Math.ceil(defaults.mealPlans / users.length);

          for (let i = 0; i < userMealPlansCount; i++) {
            const mealPlanData = MealPlanFactory.create({
              userId: user.userId,
              name: `${user.username}'s Meal Plan ${i + 1}`,
            });

            const mealPlan = await tx.mealPlan.create({
              data: MealPlanFactory.build(mealPlanData),
            });

            // Add recipes to meal plan
            const selectedRecipes = this.getRandomRecipes(recipes, defaults.recipesPerPlan);
            const mealPlanRecipes = this.createMealPlanRecipes(
              mealPlan.mealPlanId,
              selectedRecipes.map((r) => r.recipeId),
              mealPlan.startDate ?? new Date(),
            );

            await Promise.all(
              mealPlanRecipes.map((recipeData) => tx.mealPlanRecipe.create({ data: recipeData })),
            );

            totalMealPlanRecipes += mealPlanRecipes.length;
          }
        }

        const duration = Date.now() - startTime;
        const result: SeedResult = {
          users: users.length,
          recipes: recipes.length,
          mealPlans: defaults.mealPlans,
          mealPlanRecipes: totalMealPlanRecipes,
          duration,
        };

        this.logger.log('Database seeding completed successfully', result);
        return result;
      });
    } catch (error) {
      this.logger.error('Database seeding failed', error);
      throw error;
    }
  }

  async seedUsers(count: number = 5): Promise<{ userId: string; username: string }[]> {
    this.logger.log(`Seeding ${count} users...`);

    const userData = UserFactory.createMany(count);
    return Promise.all(
      userData.map((data) =>
        this.prisma.user.create({
          data: UserFactory.build(data),
          select: { userId: true, username: true },
        }),
      ),
    );
  }

  async seedRecipes(count: number = 20): Promise<{ recipeId: bigint; title: string }[]> {
    this.logger.log(`Seeding ${count} recipes...`);

    const recipeData = RecipeFactory.createMany(count);
    return Promise.all(
      recipeData.map((data) =>
        this.prisma.recipe.create({
          data: RecipeFactory.build(data),
          select: { recipeId: true, title: true },
        }),
      ),
    );
  }

  async seedMealPlanForUser(
    userId: string,
    recipeIds: bigint[],
    options: {
      name?: string;
      startDate?: Date;
      daysCount?: number;
    } = {},
  ): Promise<{
    mealPlan: { mealPlanId: bigint; name: string };
    recipesAdded: number;
  }> {
    const { name = 'Test Meal Plan', startDate = new Date(), daysCount = 7 } = options;

    return this.transactionService.executeTransaction(async (tx) => {
      // Create meal plan
      const mealPlanData = MealPlanFactory.create({
        userId,
        name,
        startDate,
        endDate: new Date(startDate.getTime() + daysCount * 24 * 60 * 60 * 1000),
      });

      const mealPlan = await tx.mealPlan.create({
        data: MealPlanFactory.build(mealPlanData),
        select: { mealPlanId: true, name: true },
      });

      // Create meal plan recipes
      const mealPlanRecipes = this.createMealPlanRecipes(
        mealPlan.mealPlanId,
        recipeIds.slice(0, daysCount * 3), // 3 meals per day max
        startDate,
      );

      await Promise.all(
        mealPlanRecipes.map((recipeData) => tx.mealPlanRecipe.create({ data: recipeData })),
      );

      return {
        mealPlan,
        recipesAdded: mealPlanRecipes.length,
      };
    });
  }

  async cleanDatabase(tx?: any): Promise<void> {
    const client = tx || this.prisma;

    this.logger.log('Cleaning existing test data...');

    // Delete in order to respect foreign key constraints
    await client.mealPlanRecipe.deleteMany({});
    await client.mealPlan.deleteMany({});
    await client.recipe.deleteMany({});
    await client.user.deleteMany({});

    this.logger.log('Database cleaned successfully');
  }

  private getRandomRecipes<T>(recipes: T[], count: number): T[] {
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, recipes.length));
  }

  private createMealPlanRecipes(
    mealPlanId: bigint,
    recipeIds: bigint[],
    startDate: Date,
  ): Array<{
    mealPlanId: bigint;
    recipeId: bigint;
    mealDate: Date;
    mealType: MealType;
  }> {
    const recipes = [];
    const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];
    let recipeIndex = 0;

    // Create up to 7 days of meals
    for (let day = 0; day < 7 && recipeIndex < recipeIds.length; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      // Add 1-3 meals per day
      const mealsPerDay = Math.min(3, recipeIds.length - recipeIndex);

      for (let meal = 0; meal < mealsPerDay; meal++) {
        if (recipeIndex >= recipeIds.length) break;

        const recipeId = recipeIds[recipeIndex];
        const mealType = mealTypes[meal];

        if (recipeId && mealType) {
          recipes.push({
            mealPlanId,
            recipeId,
            mealDate: currentDate,
            mealType,
          });
        }

        recipeIndex++;
      }
    }

    return recipes;
  }
}
