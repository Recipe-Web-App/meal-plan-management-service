import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateMealPlanRecipeDto } from './create-meal-plan-recipe.dto';

describe('CreateMealPlanRecipeDto', () => {
  const validData = {
    recipeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    day: 1,
    mealType: 'breakfast' as const,
    servings: 4,
    notes: 'Prepare the night before for easier morning prep',
  };

  describe('valid data', () => {
    it('should pass validation with all valid fields', async () => {
      const dto = plainToClass(CreateMealPlanRecipeDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.recipeId).toBe(validData.recipeId);
      expect(dto.day).toBe(validData.day);
      expect(dto.mealType).toBe(validData.mealType);
      expect(dto.servings).toBe(validData.servings);
      expect(dto.notes).toBe(validData.notes);
    });

    it('should pass validation with only required fields', async () => {
      const minimalData = {
        recipeId: validData.recipeId,
        day: validData.day,
        mealType: validData.mealType,
      };

      const dto = plainToClass(CreateMealPlanRecipeDto, minimalData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.servings).toBe(1); // default value
      expect(dto.notes).toBeUndefined();
    });

    it('should transform string numbers to integers', async () => {
      const dataWithStrings = {
        ...validData,
        day: '3' as any,
        servings: '2' as any,
      };

      const dto = plainToClass(CreateMealPlanRecipeDto, dataWithStrings);

      expect(dto.day).toBe(3);
      expect(dto.servings).toBe(2);
      expect(typeof dto.day).toBe('number');
      expect(typeof dto.servings).toBe('number');
    });

    it('should accept all valid meal types', async () => {
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

      for (const mealType of mealTypes) {
        const testData = { ...validData, mealType };
        const dto = plainToClass(CreateMealPlanRecipeDto, testData);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.mealType).toBe(mealType);
      }
    });

    it('should accept all valid day values', async () => {
      for (let day = 1; day <= 7; day++) {
        const testData = { ...validData, day };
        const dto = plainToClass(CreateMealPlanRecipeDto, testData);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.day).toBe(day);
      }
    });

    it('should accept valid servings range', async () => {
      const servingsToTest = [1, 5, 10, 20];

      for (const servings of servingsToTest) {
        const testData = { ...validData, servings };
        const dto = plainToClass(CreateMealPlanRecipeDto, testData);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.servings).toBe(servings);
      }
    });
  });

  describe('recipeId validation', () => {
    it('should fail when recipeId is missing', async () => {
      const invalidData = { ...validData };
      delete invalidData.recipeId;

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('recipeId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when recipeId is empty string', async () => {
      const invalidData = { ...validData, recipeId: '' };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('recipeId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when recipeId is not a string', async () => {
      const invalidData = { ...validData, recipeId: 123 as any };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('recipeId');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when recipeId is not a valid UUID', async () => {
      const invalidData = { ...validData, recipeId: 'invalid-uuid' };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('recipeId');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });
  });

  describe('day validation', () => {
    it('should fail when day is missing', async () => {
      const invalidData = { ...validData };
      delete invalidData.day;

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('day');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when day is not an integer', async () => {
      const invalidData = { ...validData, day: 1.5 as any };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('day');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should fail when day is less than 1', async () => {
      const invalidData = { ...validData, day: 0 };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('day');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail when day is greater than 7', async () => {
      const invalidData = { ...validData, day: 8 };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('day');
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should fail when day is not a number', async () => {
      const invalidData = { ...validData, day: 'monday' as any };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('day');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });
  });

  describe('mealType validation', () => {
    it('should fail when mealType is missing', async () => {
      const invalidData = { ...validData };
      delete invalidData.mealType;

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mealType');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when mealType is empty string', async () => {
      const invalidData = { ...validData, mealType: '' as any };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mealType');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when mealType is not a string', async () => {
      const invalidData = { ...validData, mealType: 123 as any };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mealType');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when mealType is invalid value', async () => {
      const invalidData = { ...validData, mealType: 'brunch' as any };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mealType');
      expect(errors[0].constraints).toHaveProperty('isIn');
    });
  });

  describe('servings validation', () => {
    it('should pass when servings is undefined (uses default)', async () => {
      const dataWithoutServings = { ...validData };
      delete dataWithoutServings.servings;

      const dto = plainToClass(CreateMealPlanRecipeDto, dataWithoutServings);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.servings).toBe(1);
    });

    it('should fail when servings is not an integer', async () => {
      const invalidData = { ...validData, servings: 2.5 as any };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('servings');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should fail when servings is less than 1', async () => {
      const invalidData = { ...validData, servings: 0 };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('servings');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail when servings is greater than 20', async () => {
      const invalidData = { ...validData, servings: 21 };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('servings');
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should fail when servings is not a number', async () => {
      const invalidData = { ...validData, servings: 'many' as any };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('servings');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });
  });

  describe('notes validation', () => {
    it('should pass when notes is undefined', async () => {
      const dataWithoutNotes = { ...validData };
      delete dataWithoutNotes.notes;

      const dto = plainToClass(CreateMealPlanRecipeDto, dataWithoutNotes);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.notes).toBeUndefined();
    });

    it('should pass when notes is empty string', async () => {
      const dataWithEmptyNotes = { ...validData, notes: '' };

      const dto = plainToClass(CreateMealPlanRecipeDto, dataWithEmptyNotes);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.notes).toBe('');
    });

    it('should pass when notes is at maximum length', async () => {
      const longNotes = { ...validData, notes: 'a'.repeat(300) };

      const dto = plainToClass(CreateMealPlanRecipeDto, longNotes);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail when notes is not a string', async () => {
      const invalidData = { ...validData, notes: 123 as any };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThanOrEqual(1);
      const notesError = errors.find((error) => error.property === 'notes');
      expect(notesError).toBeDefined();
      expect(notesError!.constraints).toHaveProperty('isString');
    });
  });

  describe('combined scenarios', () => {
    it('should handle multiple validation errors', async () => {
      const invalidData = {
        recipeId: 'invalid-uuid',
        day: 0,
        mealType: 'brunch' as any,
        servings: 25,
        notes: 123 as any,
      };

      const dto = plainToClass(CreateMealPlanRecipeDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(1);

      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('recipeId');
      expect(errorProperties).toContain('day');
      expect(errorProperties).toContain('servings');
      expect(errorProperties).toContain('notes');
    });

    it('should validate different meal combinations', async () => {
      const combinations = [
        { day: 1, mealType: 'breakfast', servings: 2 },
        { day: 3, mealType: 'lunch', servings: 4 },
        { day: 5, mealType: 'dinner', servings: 6 },
        { day: 7, mealType: 'snack', servings: 1 },
      ] as const;

      for (const combination of combinations) {
        const testData = { ...validData, ...combination };
        const dto = plainToClass(CreateMealPlanRecipeDto, testData);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.day).toBe(combination.day);
        expect(dto.mealType).toBe(combination.mealType);
        expect(dto.servings).toBe(combination.servings);
      }
    });
  });
});
