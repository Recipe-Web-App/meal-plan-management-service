import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MealPlanQueryDto } from './meal-plan-query.dto';

describe('MealPlanQueryDto', () => {
  const validData = {
    userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    isActive: true,
    startDateFrom: '2025-08-29T00:00:00.000Z',
    endDateTo: '2025-12-31T23:59:59.999Z',
    nameSearch: 'family',
    descriptionSearch: 'healthy',
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
    includeRecipes: true,
    includeArchived: false,
  };

  describe('valid data', () => {
    it('should pass validation with all valid fields', async () => {
      const dto = plainToClass(MealPlanQueryDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.userId).toBe(validData.userId);
      expect(dto.isActive).toBe(validData.isActive);
      expect(dto.startDateFrom).toBeInstanceOf(Date);
      expect(dto.endDateTo).toBeInstanceOf(Date);
      expect(dto.nameSearch).toBe(validData.nameSearch);
      expect(dto.descriptionSearch).toBe(validData.descriptionSearch);
      expect(dto.sortBy).toBe(validData.sortBy);
      expect(dto.sortOrder).toBe(validData.sortOrder);
      expect(dto.includeRecipes).toBe(validData.includeRecipes);
      expect(dto.includeArchived).toBe(validData.includeArchived);
    });

    it('should pass validation with empty object (all fields optional)', async () => {
      const dto = plainToClass(MealPlanQueryDto, {});
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.userId).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
      expect(dto.startDateFrom).toBeUndefined();
      expect(dto.endDateTo).toBeUndefined();
      expect(dto.nameSearch).toBeUndefined();
      expect(dto.descriptionSearch).toBeUndefined();
      expect(dto.sortBy).toBeUndefined();
      expect(dto.sortOrder).toBe('desc'); // default value
      expect(dto.includeRecipes).toBe(false); // default value
      expect(dto.includeArchived).toBe(false); // default value
    });

    it('should pass validation with partial data', async () => {
      const partialData = {
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        isActive: true,
        sortBy: 'name' as const,
      };

      const dto = plainToClass(MealPlanQueryDto, partialData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.userId).toBe(partialData.userId);
      expect(dto.isActive).toBe(partialData.isActive);
      expect(dto.sortBy).toBe(partialData.sortBy);
      expect(dto.sortOrder).toBe('desc');
    });

    it('should transform string dates to Date objects', async () => {
      const dto = plainToClass(MealPlanQueryDto, validData);

      expect(dto.startDateFrom).toBeInstanceOf(Date);
      expect(dto.endDateTo).toBeInstanceOf(Date);
      expect(dto.startDateFrom?.toISOString()).toBe('2025-08-29T00:00:00.000Z');
      expect(dto.endDateTo?.toISOString()).toBe('2025-12-31T23:59:59.999Z');
    });

    it('should transform string booleans to boolean', async () => {
      const dataWithStringBooleans = {
        isActive: 'true' as any,
        includeRecipes: 'false' as any,
        includeArchived: 'true' as any,
      };

      const dto = plainToClass(MealPlanQueryDto, dataWithStringBooleans);

      expect(dto.isActive).toBe(true);
      expect(dto.includeRecipes).toBe(false);
      expect(dto.includeArchived).toBe(true);
      expect(typeof dto.isActive).toBe('boolean');
      expect(typeof dto.includeRecipes).toBe('boolean');
      expect(typeof dto.includeArchived).toBe('boolean');
    });
  });

  describe('userId validation', () => {
    it('should fail when userId is not a string', async () => {
      const invalidData = { userId: 123 as any };

      const dto = plainToClass(MealPlanQueryDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when userId is not a valid UUID', async () => {
      const invalidData = { userId: 'invalid-uuid' };

      const dto = plainToClass(MealPlanQueryDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should pass when userId is valid UUID', async () => {
      const validUUIDs = [
        'f9811ac1-a804-4431-ba47-58ababbc44f3',
        '1526328b-5261-451e-a5fa-a51caf4df909',
        'b5abee52-af93-4538-bc98-c82d4fcc6cf0',
      ];

      for (const userId of validUUIDs) {
        const dto = plainToClass(MealPlanQueryDto, { userId });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.userId).toBe(userId);
      }
    });
  });

  describe('date validation', () => {
    it('should fail when startDateFrom is invalid date string', async () => {
      const invalidData = { startDateFrom: 'invalid-date' as any };

      const dto = plainToClass(MealPlanQueryDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('startDateFrom');
      expect(errors[0].constraints).toHaveProperty('isDate');
    });

    it('should fail when endDateTo is invalid date string', async () => {
      const invalidData = { endDateTo: 'invalid-date' as any };

      const dto = plainToClass(MealPlanQueryDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('endDateTo');
      expect(errors[0].constraints).toHaveProperty('isDate');
    });

    it('should accept different valid date formats', async () => {
      const validDateFormats = [
        { startDateFrom: '2025-08-29', endDateTo: '2025-12-31' },
        { startDateFrom: new Date('2025-08-29'), endDateTo: new Date('2025-12-31') },
        { startDateFrom: '2025-08-29T10:30:00Z', endDateTo: '2025-12-31T15:45:00Z' },
      ];

      for (const dateFormat of validDateFormats) {
        const dto = plainToClass(MealPlanQueryDto, dateFormat);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.startDateFrom).toBeInstanceOf(Date);
        expect(dto.endDateTo).toBeInstanceOf(Date);
      }
    });

    it('should handle only one date field being provided', async () => {
      const startOnlyData = { startDateFrom: '2025-08-29T00:00:00.000Z' };
      const endOnlyData = { endDateTo: '2025-12-31T23:59:59.999Z' };

      const startDto = plainToClass(MealPlanQueryDto, startOnlyData);
      const endDto = plainToClass(MealPlanQueryDto, endOnlyData);

      const startErrors = await validate(startDto);
      const endErrors = await validate(endDto);

      expect(startErrors).toHaveLength(0);
      expect(endErrors).toHaveLength(0);
      expect(startDto.startDateFrom).toBeInstanceOf(Date);
      expect(startDto.endDateTo).toBeUndefined();
      expect(endDto.endDateTo).toBeInstanceOf(Date);
      expect(endDto.startDateFrom).toBeUndefined();
    });
  });

  describe('search fields validation', () => {
    it('should fail when nameSearch is not a string', async () => {
      const invalidData = { nameSearch: 123 as any };

      const dto = plainToClass(MealPlanQueryDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('nameSearch');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when descriptionSearch is not a string', async () => {
      const invalidData = { descriptionSearch: 123 as any };

      const dto = plainToClass(MealPlanQueryDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('descriptionSearch');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass with empty search strings', async () => {
      const dataWithEmptySearch = {
        nameSearch: '',
        descriptionSearch: '',
      };

      const dto = plainToClass(MealPlanQueryDto, dataWithEmptySearch);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.nameSearch).toBe('');
      expect(dto.descriptionSearch).toBe('');
    });
  });

  describe('sorting validation', () => {
    it('should accept all valid sortBy values', async () => {
      const validSortBy = ['name', 'startDate', 'endDate', 'createdAt', 'updatedAt'] as const;

      for (const sortBy of validSortBy) {
        const dto = plainToClass(MealPlanQueryDto, { sortBy });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.sortBy).toBe(sortBy);
      }
    });

    it('should fail when sortBy is invalid', async () => {
      const invalidData = { sortBy: 'invalid' as any };

      const dto = plainToClass(MealPlanQueryDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('sortBy');
      expect(errors[0].constraints).toHaveProperty('isIn');
    });

    it('should accept valid sortOrder values', async () => {
      const validSortOrders = ['asc', 'desc'] as const;

      for (const sortOrder of validSortOrders) {
        const dto = plainToClass(MealPlanQueryDto, { sortOrder });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.sortOrder).toBe(sortOrder);
      }
    });

    it('should fail when sortOrder is invalid', async () => {
      const invalidData = { sortOrder: 'invalid' as any };

      const dto = plainToClass(MealPlanQueryDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('sortOrder');
      expect(errors[0].constraints).toHaveProperty('isIn');
    });

    it('should use default sortOrder when not provided', async () => {
      const dto = plainToClass(MealPlanQueryDto, {});

      expect(dto.sortOrder).toBe('desc');
    });
  });

  describe('boolean fields validation', () => {
    it('should handle all boolean combinations', async () => {
      const booleanCombinations = [
        { isActive: true, includeRecipes: true, includeArchived: true },
        { isActive: false, includeRecipes: false, includeArchived: false },
        { isActive: true, includeRecipes: false, includeArchived: true },
        { isActive: false, includeRecipes: true, includeArchived: false },
      ];

      for (const combo of booleanCombinations) {
        const dto = plainToClass(MealPlanQueryDto, combo);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.isActive).toBe(combo.isActive);
        expect(dto.includeRecipes).toBe(combo.includeRecipes);
        expect(dto.includeArchived).toBe(combo.includeArchived);
      }
    });

    it('should transform string booleans correctly', async () => {
      const stringBooleanData = {
        isActive: 'true',
        includeRecipes: 'false',
        includeArchived: 'TRUE',
      } as any;

      const dto = plainToClass(MealPlanQueryDto, stringBooleanData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(true);
      expect(dto.includeRecipes).toBe(false);
      expect(dto.includeArchived).toBe(true);
    });

    it('should handle invalid boolean strings', async () => {
      const invalidBooleanData = {
        isActive: 'invalid',
      } as any;

      const dto = plainToClass(MealPlanQueryDto, invalidBooleanData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('isActive');
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });

    it('should use default values for boolean fields', async () => {
      const dto = plainToClass(MealPlanQueryDto, {});

      expect(dto.includeRecipes).toBe(false);
      expect(dto.includeArchived).toBe(false);
      expect(dto.isActive).toBeUndefined(); // no default for this field
    });
  });

  describe('combined scenarios', () => {
    it('should handle mixed valid and invalid fields', async () => {
      const mixedData = {
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // valid
        isActive: 'invalid', // invalid
        startDateFrom: '2025-08-29T00:00:00.000Z', // valid
        sortBy: 'invalid', // invalid
        includeRecipes: true, // valid
      };

      const dto = plainToClass(MealPlanQueryDto, mixedData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(2);

      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('isActive');
      expect(errorProperties).toContain('sortBy');
      expect(errorProperties).not.toContain('userId');
      expect(errorProperties).not.toContain('startDateFrom');
      expect(errorProperties).not.toContain('includeRecipes');
    });

    it('should handle complex filter combinations', async () => {
      const complexFilter = {
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        isActive: true,
        startDateFrom: '2025-01-01T00:00:00.000Z',
        endDateTo: '2025-12-31T23:59:59.999Z',
        nameSearch: 'family meal',
        descriptionSearch: 'healthy balanced',
        sortBy: 'startDate',
        sortOrder: 'asc',
        includeRecipes: true,
        includeArchived: false,
      } as const;

      const dto = plainToClass(MealPlanQueryDto, complexFilter);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.userId).toBe(complexFilter.userId);
      expect(dto.isActive).toBe(complexFilter.isActive);
      expect(dto.startDateFrom).toBeInstanceOf(Date);
      expect(dto.endDateTo).toBeInstanceOf(Date);
      expect(dto.nameSearch).toBe(complexFilter.nameSearch);
      expect(dto.descriptionSearch).toBe(complexFilter.descriptionSearch);
      expect(dto.sortBy).toBe(complexFilter.sortBy);
      expect(dto.sortOrder).toBe(complexFilter.sortOrder);
      expect(dto.includeRecipes).toBe(complexFilter.includeRecipes);
      expect(dto.includeArchived).toBe(complexFilter.includeArchived);
    });
  });
});
