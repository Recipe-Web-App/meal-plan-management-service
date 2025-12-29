import { describe, it, expect } from 'bun:test';
import { plainToClass } from 'class-transformer';
import { MealPlanResponseDto, MealPlanRecipeResponseDto } from './meal-plan-response.dto';

describe('MealPlanRecipeResponseDto', () => {
  const validRecipeData = {
    recipeId: '123e4567-e89b-12d3-a456-426614174001',
    recipeName: 'Overnight Oats with Berries',
    day: 1,
    mealType: 'breakfast' as const,
    servings: 4,
    notes: 'Prepare the night before',
    prepTime: 15,
    cookTime: 0,
    difficulty: 'easy' as const,
  };

  it('should properly expose all fields', () => {
    const dto = plainToClass(MealPlanRecipeResponseDto, validRecipeData);

    expect(dto.recipeId).toBe(validRecipeData.recipeId);
    expect(dto.recipeName).toBe(validRecipeData.recipeName);
    expect(dto.day).toBe(validRecipeData.day);
    expect(dto.mealType).toBe(validRecipeData.mealType);
    expect(dto.servings).toBe(validRecipeData.servings);
    expect(dto.notes).toBe(validRecipeData.notes);
    expect(dto.prepTime).toBe(validRecipeData.prepTime);
    expect(dto.cookTime).toBe(validRecipeData.cookTime);
    expect(dto.difficulty).toBe(validRecipeData.difficulty);
  });

  it('should handle minimal recipe data', () => {
    const minimalData = {
      recipeId: validRecipeData.recipeId,
      recipeName: validRecipeData.recipeName,
      day: validRecipeData.day,
      mealType: validRecipeData.mealType,
      servings: validRecipeData.servings,
    };

    const dto = plainToClass(MealPlanRecipeResponseDto, minimalData);

    expect(dto.recipeId).toBe(minimalData.recipeId);
    expect(dto.recipeName).toBe(minimalData.recipeName);
    expect(dto.day).toBe(minimalData.day);
    expect(dto.mealType).toBe(minimalData.mealType);
    expect(dto.servings).toBe(minimalData.servings);
    expect(dto.notes).toBeUndefined();
    expect(dto.prepTime).toBeUndefined();
    expect(dto.cookTime).toBeUndefined();
    expect(dto.difficulty).toBeUndefined();
  });

  it('should handle all meal types', () => {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

    mealTypes.forEach((mealType) => {
      const data = { ...validRecipeData, mealType };
      const dto = plainToClass(MealPlanRecipeResponseDto, data);

      expect(dto.mealType).toBe(mealType);
    });
  });

  it('should handle all difficulty levels', () => {
    const difficulties = ['easy', 'medium', 'hard'] as const;

    difficulties.forEach((difficulty) => {
      const data = { ...validRecipeData, difficulty };
      const dto = plainToClass(MealPlanRecipeResponseDto, data);

      expect(dto.difficulty).toBe(difficulty);
    });
  });
});

describe('MealPlanResponseDto', () => {
  const validMealPlanData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Weekly Family Meal Plan',
    description: 'A healthy and balanced weekly meal plan for the family',
    startDate: '2025-08-29T00:00:00.000Z',
    endDate: '2025-09-05T23:59:59.999Z',
    isActive: true,
    createdAt: '2025-08-29T10:00:00.000Z',
    updatedAt: '2025-08-29T10:00:00.000Z',
    recipeCount: 12,
    durationDays: 7,
    recipes: [
      {
        recipeId: '123e4567-e89b-12d3-a456-426614174001',
        recipeName: 'Overnight Oats with Berries',
        day: 1,
        mealType: 'breakfast',
        servings: 4,
        notes: 'Prepare the night before',
        prepTime: 15,
        cookTime: 0,
        difficulty: 'easy',
      },
      {
        recipeId: '123e4567-e89b-12d3-a456-426614174003',
        recipeName: 'Grilled Chicken Salad',
        day: 1,
        mealType: 'lunch',
        servings: 4,
        prepTime: 20,
        cookTime: 15,
        difficulty: 'medium',
      },
    ],
  };

  describe('basic transformation', () => {
    it('should properly expose all fields', () => {
      const dto = plainToClass(MealPlanResponseDto, validMealPlanData);

      expect(dto.id).toBe(validMealPlanData.id);
      expect(dto.userId).toBe(validMealPlanData.userId);
      expect(dto.name).toBe(validMealPlanData.name);
      expect(dto.description).toBe(validMealPlanData.description);
      expect(dto.isActive).toBe(validMealPlanData.isActive);
      expect(dto.recipeCount).toBe(validMealPlanData.recipeCount);
      expect(dto.durationDays).toBe(validMealPlanData.durationDays);
    });

    it('should transform date strings to Date objects', () => {
      const dto = plainToClass(MealPlanResponseDto, validMealPlanData);

      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(dto.updatedAt).toBeInstanceOf(Date);

      expect(dto.startDate.toISOString()).toBe('2025-08-29T00:00:00.000Z');
      expect(dto.endDate.toISOString()).toBe('2025-09-05T23:59:59.999Z');
      expect(dto.createdAt.toISOString()).toBe('2025-08-29T10:00:00.000Z');
      expect(dto.updatedAt.toISOString()).toBe('2025-08-29T10:00:00.000Z');
    });

    it('should handle Date objects as input', () => {
      const dataWithDates = {
        ...validMealPlanData,
        startDate: new Date('2025-08-29T00:00:00.000Z'),
        endDate: new Date('2025-09-05T23:59:59.999Z'),
        createdAt: new Date('2025-08-29T10:00:00.000Z'),
        updatedAt: new Date('2025-08-29T10:00:00.000Z'),
      };

      const dto = plainToClass(MealPlanResponseDto, dataWithDates);

      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(dto.updatedAt).toBeInstanceOf(Date);

      expect(dto.startDate.toISOString()).toBe('2025-08-29T00:00:00.000Z');
      expect(dto.endDate.toISOString()).toBe('2025-09-05T23:59:59.999Z');
    });
  });

  describe('minimal data handling', () => {
    it('should handle minimal meal plan data', () => {
      const minimalData = {
        id: validMealPlanData.id,
        userId: validMealPlanData.userId,
        name: validMealPlanData.name,
        startDate: validMealPlanData.startDate,
        endDate: validMealPlanData.endDate,
        isActive: validMealPlanData.isActive,
        createdAt: validMealPlanData.createdAt,
        updatedAt: validMealPlanData.updatedAt,
      };

      const dto = plainToClass(MealPlanResponseDto, minimalData);

      expect(dto.id).toBe(minimalData.id);
      expect(dto.userId).toBe(minimalData.userId);
      expect(dto.name).toBe(minimalData.name);
      expect(dto.isActive).toBe(minimalData.isActive);
      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(dto.updatedAt).toBeInstanceOf(Date);

      expect(dto.description).toBeUndefined();
      expect(dto.recipes).toBeUndefined();
      expect(dto.recipeCount).toBeUndefined();
      expect(dto.durationDays).toBeUndefined();
    });

    it('should handle meal plan with empty recipes array', () => {
      const dataWithEmptyRecipes = {
        ...validMealPlanData,
        recipes: [],
        recipeCount: 0,
      };

      const dto = plainToClass(MealPlanResponseDto, dataWithEmptyRecipes);

      expect(dto.recipes).toEqual([]);
      expect(dto.recipeCount).toBe(0);
    });
  });

  describe('nested recipe transformation', () => {
    it('should properly transform nested recipes', () => {
      const dto = plainToClass(MealPlanResponseDto, validMealPlanData);

      expect(dto.recipes).toHaveLength(2);
      expect(dto.recipes).toBeInstanceOf(Array);

      const firstRecipe = dto.recipes![0];
      expect(firstRecipe).toBeInstanceOf(MealPlanRecipeResponseDto);
      expect(firstRecipe?.recipeId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(firstRecipe?.recipeName).toBe('Overnight Oats with Berries');
      expect(firstRecipe?.day).toBe(1);
      expect(firstRecipe?.mealType).toBe('breakfast');
      expect(firstRecipe?.servings).toBe(4);
      expect(firstRecipe?.notes).toBe('Prepare the night before');

      const secondRecipe = dto.recipes![1];
      expect(secondRecipe).toBeInstanceOf(MealPlanRecipeResponseDto);
      expect(secondRecipe?.recipeId).toBe('123e4567-e89b-12d3-a456-426614174003');
      expect(secondRecipe?.recipeName).toBe('Grilled Chicken Salad');
      expect(secondRecipe?.day).toBe(1);
      expect(secondRecipe?.mealType).toBe('lunch');
      expect(secondRecipe?.servings).toBe(4);
      expect(secondRecipe?.notes).toBeUndefined();
    });

    it('should handle recipes with various meal types and difficulties', () => {
      const dataWithVariedRecipes = {
        ...validMealPlanData,
        recipes: [
          { ...validMealPlanData.recipes[0], mealType: 'breakfast', difficulty: 'easy' },
          { ...validMealPlanData.recipes[0], mealType: 'lunch', difficulty: 'medium' },
          { ...validMealPlanData.recipes[0], mealType: 'dinner', difficulty: 'hard' },
          { ...validMealPlanData.recipes[0], mealType: 'snack', difficulty: 'easy' },
        ],
      };

      const dto = plainToClass(MealPlanResponseDto, dataWithVariedRecipes);

      expect(dto.recipes![0]?.mealType).toBe('breakfast');
      expect(dto.recipes![0]?.difficulty).toBe('easy');
      expect(dto.recipes![1]?.mealType).toBe('lunch');
      expect(dto.recipes![1]?.difficulty).toBe('medium');
      expect(dto.recipes![2]?.mealType).toBe('dinner');
      expect(dto.recipes![2]?.difficulty).toBe('hard');
      expect(dto.recipes![3]?.mealType).toBe('snack');
      expect(dto.recipes![3]?.difficulty).toBe('easy');
    });
  });

  describe('special cases', () => {
    it('should handle inactive meal plan', () => {
      const inactiveData = { ...validMealPlanData, isActive: false };
      const dto = plainToClass(MealPlanResponseDto, inactiveData);

      expect(dto.isActive).toBe(false);
    });

    it('should handle null description', () => {
      const dataWithNullDescription = { ...validMealPlanData, description: null };
      const dto = plainToClass(MealPlanResponseDto, dataWithNullDescription);

      expect(dto.description).toBeNull();
    });

    it('should handle zero counts', () => {
      const dataWithZeroCounts = {
        ...validMealPlanData,
        recipeCount: 0,
        durationDays: 0,
      };

      const dto = plainToClass(MealPlanResponseDto, dataWithZeroCounts);

      expect(dto.recipeCount).toBe(0);
      expect(dto.durationDays).toBe(0);
    });

    it('should handle large counts', () => {
      const dataWithLargeCounts = {
        ...validMealPlanData,
        recipeCount: 100,
        durationDays: 365,
      };

      const dto = plainToClass(MealPlanResponseDto, dataWithLargeCounts);

      expect(dto.recipeCount).toBe(100);
      expect(dto.durationDays).toBe(365);
    });
  });
});
