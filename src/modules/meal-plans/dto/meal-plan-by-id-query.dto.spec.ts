import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MealPlanByIdQueryDto } from './meal-plan-by-id-query.dto';
import { MealType } from '../enums/meal-type.enum';

describe('MealPlanByIdQueryDto', () => {
  it('should validate successfully with minimal valid data', async () => {
    const dto = plainToInstance(MealPlanByIdQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate successfully with all valid properties', async () => {
    const dto = plainToInstance(MealPlanByIdQueryDto, {
      viewMode: 'day',
      filterDate: '2024-03-15',
      filterStartDate: '2024-03-11',
      filterEndDate: '2024-03-17',
      filterYear: 2024,
      filterMonth: 3,
      mealType: MealType.BREAKFAST,
      groupByMealType: true,
      includeRecipes: true,
      includeStatistics: true,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('viewMode validation', () => {
    it('should accept valid view modes', async () => {
      const validModes = ['full', 'day', 'week', 'month'];

      for (const mode of validModes) {
        const dto = plainToInstance(MealPlanByIdQueryDto, { viewMode: mode });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject invalid view modes', async () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, { viewMode: 'invalid' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty('isIn');
    });
  });

  describe('date validation', () => {
    it('should accept valid ISO date strings', async () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, {
        filterDate: '2024-03-15',
        filterStartDate: '2024-03-11',
        filterEndDate: '2024-03-17',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should transform date strings to Date objects', () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, {
        filterDate: '2024-03-15',
      });

      expect(dto.filterDate).toBeInstanceOf(Date);
      if (dto.filterDate) {
        const dateStr = dto.filterDate.toISOString().split('T')[0];
        expect(dateStr).toBe('2024-03-15');
      }
    });
  });

  describe('year and month validation', () => {
    it('should accept valid year range', async () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, {
        filterYear: 2024,
        filterMonth: 6,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject year below minimum', async () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, {
        filterYear: 2019,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty('min');
    });

    it('should reject year above maximum', async () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, {
        filterYear: 2101,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty('max');
    });

    it('should reject month below 1', async () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, {
        filterMonth: 0,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty('min');
    });

    it('should reject month above 12', async () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, {
        filterMonth: 13,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty('max');
    });
  });

  describe('meal type validation', () => {
    it('should accept valid meal types', async () => {
      const validTypes = Object.values(MealType);

      for (const type of validTypes) {
        const dto = plainToInstance(MealPlanByIdQueryDto, { mealType: type });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject invalid meal types', async () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, { mealType: 'INVALID' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty('isEnum');
    });
  });

  describe('boolean validation', () => {
    it('should accept boolean values', async () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, {
        groupByMealType: true,
        includeRecipes: false,
        includeStatistics: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should transform string booleans', () => {
      const dto = plainToInstance(MealPlanByIdQueryDto, {
        groupByMealType: 'true',
        includeRecipes: 'false',
      });

      expect(dto.groupByMealType).toBe(true);
      expect(dto.includeRecipes).toBe(false);
    });
  });

  describe('comprehensive branch coverage tests', () => {
    describe('date transformation edge cases', () => {
      it('should handle null date values', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          filterDate: null,
          filterStartDate: null,
          filterEndDate: null,
        });

        expect(dto.filterDate).toBeNull();
        expect(dto.filterStartDate).toBeNull();
        expect(dto.filterEndDate).toBeNull();
      });

      it('should handle undefined date values', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          filterDate: undefined,
          filterStartDate: undefined,
          filterEndDate: undefined,
        });

        expect(dto.filterDate).toBeUndefined();
        expect(dto.filterStartDate).toBeUndefined();
        expect(dto.filterEndDate).toBeUndefined();
      });

      it('should handle Date objects as input', () => {
        const testDate = new Date('2024-03-15');
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          filterDate: testDate,
          filterStartDate: testDate,
          filterEndDate: testDate,
        });

        expect(dto.filterDate).toEqual(testDate);
        expect(dto.filterStartDate).toEqual(testDate);
        expect(dto.filterEndDate).toEqual(testDate);
      });

      it('should test date transformation error handling', async () => {
        // Test validation catches invalid dates that the transform creates
        const dtoWithInvalidDate = plainToInstance(MealPlanByIdQueryDto, {
          filterDate: 'invalid-date-string',
        });

        const errors = await validate(dtoWithInvalidDate);
        expect(errors).toHaveLength(1);
        expect(errors[0]?.constraints).toHaveProperty('isDate');
      });

      it('should handle various valid date formats', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          filterDate: '2024-03-15T10:30:00Z',
          filterStartDate: '2024/03/15',
          filterEndDate: 'March 15, 2024',
        });

        expect(dto.filterDate).toBeInstanceOf(Date);
        expect(dto.filterStartDate).toBeInstanceOf(Date);
        expect(dto.filterEndDate).toBeInstanceOf(Date);
      });

      it('should handle numeric inputs to date fields', () => {
        const timestamp = new Date('2024-03-15').getTime();
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          filterDate: timestamp,
        });

        // Numeric inputs pass through the @Type() decorator which converts them to Date objects
        expect(dto.filterDate).toBeInstanceOf(Date);
        expect(dto.filterDate).toEqual(new Date(timestamp));
      });
    });

    describe('boolean transformation comprehensive tests', () => {
      it('should handle string "true" for all boolean fields', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: 'true',
          includeRecipes: 'true',
          includeStatistics: 'true',
        });

        expect(dto.groupByMealType).toBe(true);
        expect(dto.includeRecipes).toBe(true);
        expect(dto.includeStatistics).toBe(true);
      });

      it('should handle string "false" for all boolean fields', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: 'false',
          includeRecipes: 'false',
          includeStatistics: 'false',
        });

        expect(dto.groupByMealType).toBe(false);
        expect(dto.includeRecipes).toBe(false);
        expect(dto.includeStatistics).toBe(false);
      });

      it('should handle mixed case boolean strings', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: 'TRUE',
          includeRecipes: 'False',
          includeStatistics: 'True',
        });

        expect(dto.groupByMealType).toBe(true);
        expect(dto.includeRecipes).toBe(false);
        expect(dto.includeStatistics).toBe(true);
      });

      it('should handle invalid string values with defaults', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: 'invalid',
          includeRecipes: 'not-boolean',
          includeStatistics: 'random-string',
        });

        expect(dto.groupByMealType).toBe(false); // default for groupByMealType
        expect(dto.includeRecipes).toBe(true); // default for includeRecipes
        expect(dto.includeStatistics).toBe(false); // default for includeStatistics
      });

      it('should handle null values with defaults', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: null,
          includeRecipes: null,
          includeStatistics: null,
        });

        expect(dto.groupByMealType).toBe(false);
        expect(dto.includeRecipes).toBe(true);
        expect(dto.includeStatistics).toBe(false);
      });

      it('should handle undefined values with defaults', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: undefined,
          includeRecipes: undefined,
          includeStatistics: undefined,
        });

        expect(dto.groupByMealType).toBe(false);
        expect(dto.includeRecipes).toBe(true);
        expect(dto.includeStatistics).toBe(false);
      });

      it('should handle numeric boolean-like values', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: 1,
          includeRecipes: 0,
          includeStatistics: 42,
        });

        expect(dto.groupByMealType).toBe(1); // non-string values pass through
        expect(dto.includeRecipes).toBe(0);
        expect(dto.includeStatistics).toBe(42);
      });

      it('should handle empty string values', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: '',
          includeRecipes: '',
          includeStatistics: '',
        });

        expect(dto.groupByMealType).toBe(false);
        expect(dto.includeRecipes).toBe(true);
        expect(dto.includeStatistics).toBe(false);
      });

      it('should handle whitespace string values', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: '   ',
          includeRecipes: '\\t',
          includeStatistics: '\\n',
        });

        expect(dto.groupByMealType).toBe(false);
        expect(dto.includeRecipes).toBe(true);
        expect(dto.includeStatistics).toBe(false);
      });
    });

    describe('validation error scenarios', () => {
      it('should handle non-string viewMode', async () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          viewMode: 123,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0]?.constraints).toHaveProperty('isString');
      });

      it('should handle non-integer year values', async () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          filterYear: 'not-a-number',
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0]?.constraints).toHaveProperty('isInt');
      });

      it('should handle non-integer month values', async () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          filterMonth: 3.14,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0]?.constraints).toHaveProperty('isInt');
      });

      it('should handle boundary year values', async () => {
        // Test exact boundaries
        const validMin = plainToInstance(MealPlanByIdQueryDto, { filterYear: 2020 });
        const validMax = plainToInstance(MealPlanByIdQueryDto, { filterYear: 2100 });

        expect(await validate(validMin)).toHaveLength(0);
        expect(await validate(validMax)).toHaveLength(0);

        // Test just outside boundaries
        const invalidMin = plainToInstance(MealPlanByIdQueryDto, { filterYear: 2019 });
        const invalidMax = plainToInstance(MealPlanByIdQueryDto, { filterYear: 2101 });

        expect(await validate(invalidMin)).toHaveLength(1);
        expect(await validate(invalidMax)).toHaveLength(1);
      });

      it('should handle boundary month values', async () => {
        // Test exact boundaries
        const validMin = plainToInstance(MealPlanByIdQueryDto, { filterMonth: 1 });
        const validMax = plainToInstance(MealPlanByIdQueryDto, { filterMonth: 12 });

        expect(await validate(validMin)).toHaveLength(0);
        expect(await validate(validMax)).toHaveLength(0);

        // Test just outside boundaries
        const invalidMin = plainToInstance(MealPlanByIdQueryDto, { filterMonth: 0 });
        const invalidMax = plainToInstance(MealPlanByIdQueryDto, { filterMonth: 13 });

        expect(await validate(invalidMin)).toHaveLength(1);
        expect(await validate(invalidMax)).toHaveLength(1);
      });

      it('should handle non-boolean values for boolean fields', async () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          groupByMealType: 'not-boolean-but-transformed',
          includeRecipes: [],
          includeStatistics: {},
        });

        const errors = await validate(dto);
        // The transformation handles strings, but arrays/objects should fail validation
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('default value behavior', () => {
      it('should apply correct default values', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {});

        expect(dto.viewMode).toBe('full');
        expect(dto.groupByMealType).toBe(false);
        expect(dto.includeRecipes).toBe(true);
        expect(dto.includeStatistics).toBe(false);
      });

      it('should preserve explicitly set values over defaults', () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          viewMode: 'day',
          groupByMealType: true,
          includeRecipes: false,
          includeStatistics: true,
        });

        expect(dto.viewMode).toBe('day');
        expect(dto.groupByMealType).toBe(true);
        expect(dto.includeRecipes).toBe(false);
        expect(dto.includeStatistics).toBe(true);
      });
    });

    describe('complex combination scenarios', () => {
      it('should handle all fields with mixed valid/invalid values', async () => {
        const dto = plainToInstance(MealPlanByIdQueryDto, {
          viewMode: 'month',
          filterYear: 2024,
          filterMonth: 13, // invalid - should cause validation error
          mealType: MealType.DINNER,
          groupByMealType: 'TRUE',
          includeRecipes: 'false',
          includeStatistics: null,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(1); // Only filterMonth should fail
        expect(errors[0]?.constraints).toHaveProperty('max');

        // Check that other transformations worked correctly
        expect(dto.viewMode).toBe('month');
        expect(dto.filterYear).toBe(2024);
        expect(dto.mealType).toBe(MealType.DINNER);
        expect(dto.groupByMealType).toBe(true);
        expect(dto.includeRecipes).toBe(false);
        expect(dto.includeStatistics).toBe(false);
      });
    });
  });
});
