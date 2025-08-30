/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { MealPlan, MealType } from '@prisma/client';
import { faker } from '@faker-js/faker';

export interface CreateMealPlanData {
  id?: string;
  userId?: string;
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMealPlanRecipeData {
  id?: string;
  mealPlanId?: string;
  recipeId?: string;
  plannedDate?: Date;
  mealType?: MealType;
  servings?: number;
  notes?: string;
  createdAt?: Date;
}

export class MealPlanFactory {
  private static readonly MEAL_PLAN_NAMES = [
    'Weekly Meal Plan',
    'Healthy Eating Plan',
    'Family Dinner Plan',
    'Quick Meals Plan',
    'Mediterranean Diet',
    'Vegetarian Week',
    'Keto Meal Plan',
    'Comfort Food Week',
    'Summer Fresh Plan',
    'Budget Friendly Meals',
  ];

  static create(overrides: CreateMealPlanData = {}): CreateMealPlanData {
    const startDate = overrides.startDate ?? faker.date.soon({ days: 7 });
    const endDate = overrides.endDate ?? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    return {
      id: overrides.id ?? faker.string.uuid(),
      userId: overrides.userId ?? faker.string.uuid(),
      name: overrides.name ?? faker.helpers.arrayElement(MealPlanFactory.MEAL_PLAN_NAMES),
      description: overrides.description ?? faker.lorem.sentence(),
      startDate,
      endDate,
      isActive: overrides.isActive ?? faker.datatype.boolean(),
      createdAt: overrides.createdAt ?? new Date(),
      updatedAt: overrides.updatedAt ?? new Date(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: CreateMealPlanData = {}): CreateMealPlanData[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static build(overrides: CreateMealPlanData = {}): Omit<MealPlan, 'createdAt' | 'updatedAt'> & {
    createdAt?: Date;
    updatedAt?: Date;
  } {
    const data = this.create(overrides);
    const result: any = {
      mealPlanId: BigInt(Math.floor(Math.random() * 1000000)),
      userId: data.userId!,
      name: data.name!,
      description: data.description,
      startDate: data.startDate!,
      endDate: data.endDate!,
      isActive: data.isActive!,
    };

    // Only include dates if explicitly provided in overrides
    if ('createdAt' in overrides && overrides.createdAt) {
      result.createdAt = overrides.createdAt;
    }
    if ('updatedAt' in overrides && overrides.updatedAt) {
      result.updatedAt = overrides.updatedAt;
    }

    return result;
  }

  static createActiveWeekly(
    userId: string,
    overrides: CreateMealPlanData = {},
  ): CreateMealPlanData {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of current week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week

    return this.create({
      userId,
      name: 'Active Weekly Plan',
      startDate: startOfWeek,
      endDate: endOfWeek,
      isActive: true,
      ...overrides,
    });
  }

  static createRecipe(overrides: CreateMealPlanRecipeData = {}): CreateMealPlanRecipeData {
    return {
      id: overrides.id ?? faker.string.uuid(),
      mealPlanId: overrides.mealPlanId ?? Math.floor(Math.random() * 1000000).toString(),
      recipeId: overrides.recipeId ?? Math.floor(Math.random() * 1000000).toString(),
      plannedDate: overrides.plannedDate ?? faker.date.soon({ days: 7 }),
      mealType: overrides.mealType ?? faker.helpers.enumValue(MealType),
      servings: overrides.servings ?? faker.number.int({ min: 1, max: 6 }),
      notes: overrides.notes ?? faker.lorem.sentence(),
      createdAt: overrides.createdAt ?? new Date(),
      ...overrides,
    };
  }

  static createManyRecipes(
    count: number,
    overrides: CreateMealPlanRecipeData = {},
  ): CreateMealPlanRecipeData[] {
    return Array.from({ length: count }, () => this.createRecipe(overrides));
  }

  static createWeekOfMeals(
    mealPlanId: string,
    recipeIds: string[],
    startDate?: Date,
  ): CreateMealPlanRecipeData[] {
    const start = startDate ?? new Date();
    const recipes: CreateMealPlanRecipeData[] = [];
    const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];

    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);

      mealTypes.forEach((mealType, index) => {
        const recipeId = recipeIds[day * 3 + index];
        if (recipeId) {
          recipes.push(
            this.createRecipe({
              mealPlanId,
              recipeId,
              plannedDate: currentDate,
              mealType,
              servings: faker.number.int({ min: 2, max: 4 }),
            }),
          );
        }
      });
    }

    return recipes;
  }

  static createMealForDate(
    mealPlanId: string,
    recipeId: string,
    date: Date,
    mealType: MealType,
    overrides: Partial<CreateMealPlanRecipeData> = {},
  ): CreateMealPlanRecipeData {
    return this.createRecipe({
      mealPlanId,
      recipeId,
      plannedDate: date,
      mealType,
      servings: 2,
      ...overrides,
    });
  }
}
