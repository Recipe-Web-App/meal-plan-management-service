import { RecipeFactory } from './recipe.factory';

describe('RecipeFactory', () => {
  describe('create', () => {
    it('should create recipe data with default values', () => {
      const recipeData = RecipeFactory.create();

      expect(recipeData).toHaveProperty('id');
      expect(recipeData).toHaveProperty('title');
      expect(recipeData).toHaveProperty('description');
      expect(recipeData).toHaveProperty('cookingTime');
      expect(recipeData).toHaveProperty('servings');
      expect(recipeData).toHaveProperty('difficulty');
      expect(recipeData).toHaveProperty('createdAt');
      expect(recipeData).toHaveProperty('updatedAt');

      expect(typeof recipeData.id).toBe('string');
      expect(typeof recipeData.title).toBe('string');
      expect(typeof recipeData.cookingTime).toBe('number');
      expect(typeof recipeData.servings).toBe('number');
      expect(recipeData.createdAt).toBeInstanceOf(Date);
    });

    it('should create recipe data with custom values', () => {
      const customData = {
        id: 'recipe-123',
        title: 'Custom Recipe',
        cookingTime: 45,
        servings: 4,
        difficulty: 'Medium',
      };

      const recipeData = RecipeFactory.create(customData);

      expect(recipeData.id).toBe(customData.id);
      expect(recipeData.title).toBe(customData.title);
      expect(recipeData.cookingTime).toBe(customData.cookingTime);
      expect(recipeData.servings).toBe(customData.servings);
      expect(recipeData.difficulty).toBe(customData.difficulty);
    });
  });

  describe('createMany', () => {
    it('should create multiple recipe data objects', () => {
      const count = 5;
      const recipesData = RecipeFactory.createMany(count);

      expect(recipesData).toHaveLength(count);
      recipesData.forEach((recipeData) => {
        expect(recipeData).toHaveProperty('id');
        expect(recipeData).toHaveProperty('title');
        expect(recipeData).toHaveProperty('cookingTime');
      });
    });

    it('should create multiple recipes with unique IDs', () => {
      const count = 5;
      const recipesData = RecipeFactory.createMany(count);

      const ids = recipesData.map((recipe) => recipe.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(count);
    });
  });

  describe('build', () => {
    it('should build recipe object for database insertion', () => {
      const recipeData = RecipeFactory.build();

      expect(recipeData).toHaveProperty('recipeId');
      expect(recipeData).toHaveProperty('userId');
      expect(recipeData).toHaveProperty('title');

      expect(typeof recipeData.recipeId).toBe('bigint');
      expect(typeof recipeData.title).toBe('string');
    });
  });

  describe('createBreakfastRecipe', () => {
    it('should create breakfast-specific recipe data', () => {
      const breakfastRecipe = RecipeFactory.createBreakfastRecipe();

      expect(breakfastRecipe.cookingTime).toBeLessThanOrEqual(30);
      expect(breakfastRecipe.cookingTime).toBeGreaterThanOrEqual(5);
      expect(['Easy', 'Medium']).toContain(breakfastRecipe.difficulty);
      expect(breakfastRecipe.title).toBeDefined();
    });

    it('should accept overrides for breakfast recipes', () => {
      const overrides = {
        title: 'Custom Breakfast',
        cookingTime: 15,
      };

      const breakfastRecipe = RecipeFactory.createBreakfastRecipe(overrides);

      expect(breakfastRecipe.title).toBe(overrides.title);
      expect(breakfastRecipe.cookingTime).toBe(overrides.cookingTime);
    });
  });

  describe('createDinnerRecipe', () => {
    it('should create dinner-specific recipe data', () => {
      const dinnerRecipe = RecipeFactory.createDinnerRecipe();

      expect(dinnerRecipe.cookingTime).toBeLessThanOrEqual(120);
      expect(dinnerRecipe.cookingTime).toBeGreaterThanOrEqual(30);
      expect(dinnerRecipe.servings).toBeLessThanOrEqual(6);
      expect(dinnerRecipe.servings).toBeGreaterThanOrEqual(2);
      expect(dinnerRecipe.title).toBeDefined();
    });

    it('should accept overrides for dinner recipes', () => {
      const overrides = {
        title: 'Custom Dinner',
        servings: 8,
      };

      const dinnerRecipe = RecipeFactory.createDinnerRecipe(overrides);

      expect(dinnerRecipe.title).toBe(overrides.title);
      expect(dinnerRecipe.servings).toBe(overrides.servings);
    });
  });

  describe('data validation', () => {
    it('should generate valid cooking times', () => {
      const recipeData = RecipeFactory.create();

      expect(recipeData.cookingTime).toBeGreaterThan(0);
      expect(recipeData.cookingTime).toBeLessThanOrEqual(180);
    });

    it('should generate valid serving sizes', () => {
      const recipeData = RecipeFactory.create();

      expect(recipeData.servings).toBeGreaterThan(0);
      expect(recipeData.servings).toBeLessThanOrEqual(8);
    });

    it('should generate valid difficulty levels', () => {
      const difficulties = [];
      for (let i = 0; i < 10; i++) {
        const recipeData = RecipeFactory.create();
        difficulties.push(recipeData.difficulty);
      }

      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      difficulties.forEach((difficulty) => {
        expect(validDifficulties).toContain(difficulty);
      });
    });

    it('should generate non-empty titles', () => {
      const recipeData = RecipeFactory.create();

      expect(recipeData.title!.trim()).toBeTruthy();
      expect(recipeData.title!.length).toBeGreaterThan(0);
    });
  });
});
