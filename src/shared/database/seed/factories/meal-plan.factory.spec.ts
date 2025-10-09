import { MealPlanFactory } from './meal-plan.factory';
import { MealType } from '@prisma/client';

describe('MealPlanFactory', () => {
  describe('create', () => {
    it('should create meal plan data with default values', () => {
      const mealPlanData = MealPlanFactory.create();

      expect(mealPlanData).toHaveProperty('userId');
      expect(mealPlanData).toHaveProperty('name');
      expect(mealPlanData).toHaveProperty('description');
      expect(mealPlanData).toHaveProperty('startDate');
      expect(mealPlanData).toHaveProperty('endDate');

      expect(typeof mealPlanData.userId).toBe('string');
      expect(typeof mealPlanData.name).toBe('string');
      expect(mealPlanData.startDate).toBeInstanceOf(Date);
      expect(mealPlanData.endDate).toBeInstanceOf(Date);
    });

    it('should create end date 7 days after start date by default', () => {
      const mealPlanData = MealPlanFactory.create();

      const expectedEndDate = new Date(mealPlanData.startDate!);
      expectedEndDate.setDate(expectedEndDate.getDate() + 7);

      expect(mealPlanData.endDate).toEqual(expectedEndDate);
    });

    it('should create meal plan data with custom values', () => {
      const customStartDate = new Date('2023-01-01');
      const customEndDate = new Date('2023-01-14');
      const customData = {
        userId: 'user-456',
        name: 'Custom Meal Plan',
        startDate: customStartDate,
        endDate: customEndDate,
      };

      const mealPlanData = MealPlanFactory.create(customData);

      expect(mealPlanData.userId).toBe(customData.userId);
      expect(mealPlanData.name).toBe(customData.name);
      expect(mealPlanData.startDate).toBe(customData.startDate);
      expect(mealPlanData.endDate).toBe(customData.endDate);
    });
  });

  describe('createMany', () => {
    it('should create multiple meal plan data objects', () => {
      const count = 3;
      const mealPlansData = MealPlanFactory.createMany(count);

      expect(mealPlansData).toHaveLength(count);
      mealPlansData.forEach((mealPlanData) => {
        expect(mealPlanData).toHaveProperty('userId');
        expect(mealPlanData).toHaveProperty('name');
      });
    });

    it('should create multiple meal plans with unique user IDs', () => {
      const count = 3;
      const mealPlansData = MealPlanFactory.createMany(count);

      const userIds = mealPlansData.map((plan) => plan.userId);
      const uniqueUserIds = new Set(userIds);

      expect(uniqueUserIds.size).toBe(count);
    });
  });

  describe('build', () => {
    it('should build meal plan object for database insertion', () => {
      const mealPlanData = MealPlanFactory.build();

      expect(mealPlanData).toHaveProperty('userId');
      expect(mealPlanData).toHaveProperty('name');
      expect(mealPlanData).toHaveProperty('description');
      expect(mealPlanData).toHaveProperty('startDate');
      expect(mealPlanData).toHaveProperty('endDate');

      expect(typeof mealPlanData.userId).toBe('string');
      expect(typeof mealPlanData.name).toBe('string');
    });
  });

  describe('createActiveWeekly', () => {
    it('should create active weekly meal plan', () => {
      const userId = 'user-123';
      const mealPlanData = MealPlanFactory.createActiveWeekly(userId);

      expect(mealPlanData.userId).toBe(userId);
      expect(mealPlanData.name).toBe('Active Weekly Plan');

      // Should span a full week
      const timeDiff = mealPlanData.endDate!.getTime() - mealPlanData.startDate!.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      expect(daysDiff).toBe(6); // 6 days difference (7 day span)
    });

    it('should accept overrides for weekly meal plan', () => {
      const userId = 'user-123';
      const overrides = {
        name: 'Custom Weekly Plan',
      };

      const mealPlanData = MealPlanFactory.createActiveWeekly(userId, overrides);

      expect(mealPlanData.name).toBe(overrides.name);
      expect(mealPlanData.userId).toBe(userId);
    });
  });

  describe('createRecipe', () => {
    it('should create meal plan recipe data with default values', () => {
      const recipeData = MealPlanFactory.createRecipe();

      expect(recipeData).toHaveProperty('id');
      expect(recipeData).toHaveProperty('mealPlanId');
      expect(recipeData).toHaveProperty('recipeId');
      expect(recipeData).toHaveProperty('plannedDate');
      expect(recipeData).toHaveProperty('mealType');
      expect(recipeData).toHaveProperty('servings');
      expect(recipeData).toHaveProperty('createdAt');

      expect(typeof recipeData.id).toBe('string');
      expect(typeof recipeData.mealPlanId).toBe('string');
      expect(typeof recipeData.recipeId).toBe('string');
      expect(recipeData.plannedDate).toBeInstanceOf(Date);
      expect(Object.values(MealType)).toContain(recipeData.mealType);
      expect(typeof recipeData.servings).toBe('number');
    });

    it('should create recipe with custom values', () => {
      const customDate = new Date('2023-01-15');
      const customData = {
        id: 'recipe-123',
        mealPlanId: 'plan-456',
        recipeId: 'recipe-789',
        plannedDate: customDate,
        mealType: MealType.DINNER,
        servings: 4,
        notes: 'Custom notes',
      };

      const recipeData = MealPlanFactory.createRecipe(customData);

      expect(recipeData.id).toBe(customData.id);
      expect(recipeData.mealPlanId).toBe(customData.mealPlanId);
      expect(recipeData.recipeId).toBe(customData.recipeId);
      expect(recipeData.plannedDate).toBe(customData.plannedDate);
      expect(recipeData.mealType).toBe(customData.mealType);
      expect(recipeData.servings).toBe(customData.servings);
      expect(recipeData.notes).toBe(customData.notes);
    });
  });

  describe('createManyRecipes', () => {
    it('should create multiple meal plan recipes', () => {
      const count = 5;
      const recipesData = MealPlanFactory.createManyRecipes(count);

      expect(recipesData).toHaveLength(count);
      recipesData.forEach((recipeData) => {
        expect(recipeData).toHaveProperty('id');
        expect(recipeData).toHaveProperty('mealPlanId');
        expect(recipeData).toHaveProperty('recipeId');
        expect(recipeData).toHaveProperty('mealType');
      });
    });

    it('should create recipes with unique IDs', () => {
      const count = 5;
      const recipesData = MealPlanFactory.createManyRecipes(count);

      const ids = recipesData.map((recipe) => recipe.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(count);
    });
  });

  describe('createWeekOfMeals', () => {
    it('should create meals for a full week', () => {
      const mealPlanId = 'plan-123';
      const recipeIds = Array.from({ length: 21 }, (_, i) => `recipe-${i}`); // 21 recipes (3 per day * 7 days)
      const startDate = new Date('2023-01-01');

      const mealsData = MealPlanFactory.createWeekOfMeals(mealPlanId, recipeIds, startDate);

      expect(mealsData).toHaveLength(21);

      // Check that all meal types are represented
      const mealTypes = mealsData.map((meal) => meal.mealType);
      expect(mealTypes).toContain(MealType.BREAKFAST);
      expect(mealTypes).toContain(MealType.LUNCH);
      expect(mealTypes).toContain(MealType.DINNER);

      // Check that all meals have the same meal plan ID
      mealsData.forEach((meal) => {
        expect(meal.mealPlanId).toBe(mealPlanId);
      });
    });

    it('should handle fewer recipe IDs than full week', () => {
      const mealPlanId = 'plan-123';
      const recipeIds = ['recipe-1', 'recipe-2', 'recipe-3']; // Only 3 recipes

      const mealsData = MealPlanFactory.createWeekOfMeals(mealPlanId, recipeIds);

      expect(mealsData).toHaveLength(3);
      mealsData.forEach((meal, index) => {
        expect(meal.recipeId).toBe(recipeIds[index]);
      });
    });
  });

  describe('createMealForDate', () => {
    it('should create meal for specific date and type', () => {
      const mealPlanId = 'plan-123';
      const recipeId = 'recipe-456';
      const date = new Date('2023-01-15');
      const mealType = MealType.LUNCH;

      const mealData = MealPlanFactory.createMealForDate(mealPlanId, recipeId, date, mealType);

      expect(mealData.mealPlanId).toBe(mealPlanId);
      expect(mealData.recipeId).toBe(recipeId);
      expect(mealData.plannedDate).toBe(date);
      expect(mealData.mealType).toBe(mealType);
      expect(mealData.servings).toBe(2); // Default servings
    });

    it('should create meal with custom overrides', () => {
      const mealPlanId = 'plan-123';
      const recipeId = 'recipe-456';
      const date = new Date('2023-01-15');
      const mealType = MealType.DINNER;
      const overrides = {
        servings: 6,
        notes: 'Family dinner',
      };

      const mealData = MealPlanFactory.createMealForDate(
        mealPlanId,
        recipeId,
        date,
        mealType,
        overrides,
      );

      expect(mealData.servings).toBe(overrides.servings);
      expect(mealData.notes).toBe(overrides.notes);
    });
  });

  describe('data validation', () => {
    it('should generate valid serving sizes', () => {
      const recipeData = MealPlanFactory.createRecipe();

      expect(recipeData.servings).toBeGreaterThan(0);
      expect(recipeData.servings).toBeLessThanOrEqual(6);
    });

    it('should generate valid meal types', () => {
      const mealTypes = [];
      for (let i = 0; i < 20; i++) {
        const recipeData = MealPlanFactory.createRecipe();
        mealTypes.push(recipeData.mealType);
      }

      mealTypes.forEach((mealType) => {
        expect(Object.values(MealType)).toContain(mealType);
      });
    });

    it('should generate dates in the future by default', () => {
      const now = new Date();
      const mealPlanData = MealPlanFactory.create();

      expect(mealPlanData.startDate!.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000); // Allow 1 second margin
    });
  });
});
