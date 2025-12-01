import { MealPlan, MealPlanRecipe, User, Recipe, MealType } from '@generated/prisma/client';

export class MealPlanFactory {
  static createMealPlan(overrides?: Partial<MealPlan>): MealPlan {
    return {
      mealPlanId: BigInt(1),
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Test Meal Plan',
      description: 'A test meal plan',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-07'),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMealPlanRecipe(overrides?: Partial<MealPlanRecipe>): MealPlanRecipe {
    return {
      mealPlanId: BigInt(1),
      recipeId: BigInt(1),
      mealDate: new Date('2024-01-02'),
      mealType: MealType.LUNCH,
      ...overrides,
    };
  }

  static createUser(overrides?: Partial<User>): User {
    return {
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      username: 'testuser',
      ...overrides,
    };
  }

  static createRecipe(overrides?: Partial<Recipe>): Recipe {
    return {
      recipeId: BigInt(1),
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Test Recipe',
      ...overrides,
    };
  }

  static createMealPlanWithRecipes(
    mealPlanOverrides?: Partial<MealPlan>,
    recipes: Partial<MealPlanRecipe>[] = [],
  ): MealPlan & { mealPlanRecipes: MealPlanRecipe[] } {
    const mealPlan = this.createMealPlan(mealPlanOverrides);
    const mealPlanRecipes = recipes.map((recipe) =>
      this.createMealPlanRecipe({
        mealPlanId: mealPlan.mealPlanId,
        ...recipe,
      }),
    );

    return {
      ...mealPlan,
      mealPlanRecipes,
    };
  }
}
