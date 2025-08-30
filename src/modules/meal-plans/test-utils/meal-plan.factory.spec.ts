import { MealPlanFactory } from './meal-plan.factory';
import { MealType } from '@prisma/client';

describe('MealPlanFactory', () => {
  describe('createMealPlan', () => {
    it('should create a meal plan', () => {
      const mealPlan = MealPlanFactory.createMealPlan();

      expect(mealPlan).toBeDefined();
      expect(mealPlan.mealPlanId).toBeDefined();
      expect(mealPlan.name).toBe('Test Meal Plan');
      expect(mealPlan.userId).toBeDefined();
    });

    it('should apply overrides', () => {
      const overrides = { name: 'Custom Plan' };
      const mealPlan = MealPlanFactory.createMealPlan(overrides);

      expect(mealPlan.name).toBe('Custom Plan');
    });
  });

  describe('createMealPlanRecipe', () => {
    it('should create a meal plan recipe', () => {
      const recipe = MealPlanFactory.createMealPlanRecipe();

      expect(recipe).toBeDefined();
      expect(recipe.mealType).toBe(MealType.LUNCH);
      expect(recipe.mealPlanId).toBeDefined();
      expect(recipe.recipeId).toBeDefined();
    });
  });

  describe('createUser', () => {
    it('should create a user', () => {
      const user = MealPlanFactory.createUser();

      expect(user).toBeDefined();
      expect(user.userId).toBeDefined();
      expect(user.username).toBeDefined();
    });
  });
});
