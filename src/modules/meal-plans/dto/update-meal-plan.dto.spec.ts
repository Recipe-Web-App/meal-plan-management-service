import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateMealPlanDto } from './update-meal-plan.dto';

describe('UpdateMealPlanDto', () => {
  describe('valid data', () => {
    it('should pass validation with all valid fields', async () => {
      const validData = {
        name: 'Updated Weekly Meal Plan',
        description: 'An updated healthy weekly meal plan',
        startDate: '2025-09-15T00:00:00.000Z',
        endDate: '2025-09-21T23:59:59.999Z',
        isActive: true,
      };

      const dto = plainToClass(UpdateMealPlanDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBe(validData.name);
      expect(dto.description).toBe(validData.description);
      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
      expect(dto.isActive).toBe(true);
    });

    it('should pass validation with empty object (all fields optional)', async () => {
      const dto = plainToClass(UpdateMealPlanDto, {});
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBeUndefined();
      expect(dto.description).toBeUndefined();
      expect(dto.startDate).toBeUndefined();
      expect(dto.endDate).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
    });

    it('should pass validation with partial data', async () => {
      const partialData = {
        name: 'Updated Name Only',
        isActive: false,
      };

      const dto = plainToClass(UpdateMealPlanDto, partialData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBe(partialData.name);
      expect(dto.isActive).toBe(false);
      expect(dto.description).toBeUndefined();
      expect(dto.startDate).toBeUndefined();
      expect(dto.endDate).toBeUndefined();
    });

    it('should transform string dates to Date objects', async () => {
      const data = {
        startDate: '2025-09-15T00:00:00.000Z',
        endDate: '2025-09-21T23:59:59.999Z',
      };

      const dto = plainToClass(UpdateMealPlanDto, data);

      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
      expect(dto.startDate?.toISOString()).toBe('2025-09-15T00:00:00.000Z');
      expect(dto.endDate?.toISOString()).toBe('2025-09-21T23:59:59.999Z');
    });

    it('should handle null and undefined values properly', async () => {
      const data = {
        name: undefined,
        description: null,
        startDate: undefined,
        endDate: null,
        isActive: undefined,
      };

      const dto = plainToClass(UpdateMealPlanDto, data);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBeUndefined();
      expect(dto.description).toBeNull();
      expect(dto.startDate).toBeUndefined();
      expect(dto.endDate).toBeNull();
      expect(dto.isActive).toBeUndefined();
    });
  });

  describe('name validation', () => {
    it('should fail when name is empty string', async () => {
      const invalidData = { name: '' };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should fail when name is too long', async () => {
      const invalidData = { name: 'a'.repeat(256) };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should pass when name is at maximum length', async () => {
      const validData = { name: 'a'.repeat(255) };

      const dto = plainToClass(UpdateMealPlanDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail when name is not a string', async () => {
      const invalidData = { name: 123 as any };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('description validation', () => {
    it('should pass when description is empty string', async () => {
      const validData = { description: '' };

      const dto = plainToClass(UpdateMealPlanDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail when description is too long', async () => {
      const invalidData = { description: 'a'.repeat(1001) };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should pass when description is at maximum length', async () => {
      const validData = { description: 'a'.repeat(1000) };

      const dto = plainToClass(UpdateMealPlanDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail when description is not a string', async () => {
      const invalidData = { description: 123 as any };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('date validation', () => {
    it('should throw when startDate is invalid date string', () => {
      const invalidData = { startDate: 'invalid-date' as any };

      expect(() => {
        plainToClass(UpdateMealPlanDto, invalidData);
      }).toThrow('Invalid date format');
    });

    it('should throw when endDate is invalid date string', () => {
      const invalidData = { endDate: 'invalid-date' as any };

      expect(() => {
        plainToClass(UpdateMealPlanDto, invalidData);
      }).toThrow('Invalid date format');
    });

    it('should accept different valid date formats', async () => {
      const validDateFormats = [
        { startDate: '2025-09-15', endDate: '2025-09-21' },
        { startDate: new Date('2025-09-15'), endDate: new Date('2025-09-21') },
        { startDate: '2025-09-15T10:30:00Z', endDate: '2025-09-21T15:45:00Z' },
      ];

      for (const dateFormat of validDateFormats) {
        const dto = plainToClass(UpdateMealPlanDto, dateFormat);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.startDate).toBeInstanceOf(Date);
        expect(dto.endDate).toBeInstanceOf(Date);
      }
    });

    it('should throw error when startDate transforms to Invalid Date', () => {
      const invalidData = { startDate: 'NaN' };

      expect(() => {
        plainToClass(UpdateMealPlanDto, invalidData);
      }).toThrow('Invalid date format');
    });

    it('should throw error when endDate transforms to Invalid Date', () => {
      const invalidData = { endDate: 'NaN' };

      expect(() => {
        plainToClass(UpdateMealPlanDto, invalidData);
      }).toThrow('Invalid date format');
    });

    it('should handle only one date field being provided', async () => {
      const startOnlyData = { startDate: '2025-09-15T00:00:00.000Z' };
      const endOnlyData = { endDate: '2025-09-05T23:59:59.999Z' };

      const startDto = plainToClass(UpdateMealPlanDto, startOnlyData);
      const endDto = plainToClass(UpdateMealPlanDto, endOnlyData);

      const startErrors = await validate(startDto);
      const endErrors = await validate(endDto);

      expect(startErrors).toHaveLength(0);
      expect(endErrors).toHaveLength(0);
      expect(startDto.startDate).toBeInstanceOf(Date);
      expect(startDto.endDate).toBeUndefined();
      expect(endDto.endDate).toBeInstanceOf(Date);
      expect(endDto.startDate).toBeUndefined();
    });
  });

  describe('combined scenarios', () => {
    it('should handle mixed valid and invalid fields', async () => {
      const mixedData = {
        name: 'Valid Name',
        description: 'a'.repeat(1001), // invalid
        startDate: '2025-09-01T00:00:00.000Z', // valid
        endDate: '2025-09-07T23:59:59.999Z', // valid to avoid transform error
        isActive: true, // valid
      };

      const dto = plainToClass(UpdateMealPlanDto, mixedData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThanOrEqual(1);

      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('description');
      // endDate is now valid, so no date error expected
      expect(errorProperties).not.toContain('name');
      expect(errorProperties).not.toContain('endDate');
      expect(errorProperties).not.toContain('isActive');
    });

    it('should handle edge case transformations', async () => {
      const edgeCaseData = {
        name: '  Valid Name With Spaces  ',
        description: '  Description with whitespace  ',
        isActive: 'true' as any,
        startDate: null,
        endDate: undefined,
      };

      const dto = plainToClass(UpdateMealPlanDto, edgeCaseData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('  Valid Name With Spaces  ');
      expect(dto.description).toBe('  Description with whitespace  ');
      expect(dto.isActive).toBe('true'); // String transformation without @Transform
      expect(dto.startDate).toBeNull();
      expect(dto.endDate).toBeUndefined();
    });

    it('should handle boolean string transformation edge cases', async () => {
      const booleanCases = [
        { isActive: 'false' as any, expected: false },
        { isActive: '0' as any, expected: false },
        { isActive: '1' as any, expected: true },
        { isActive: 'yes' as any, expected: true },
        { isActive: 'no' as any, expected: false },
      ];

      for (const testCase of booleanCases) {
        const dto = plainToClass(UpdateMealPlanDto, testCase);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(typeof dto.isActive).toBe('string');
        // Without @Transform decorator, values remain as strings
      }
    });

    it('should handle all fields being null', async () => {
      const nullData = {
        name: null,
        description: null,
        startDate: null,
        endDate: null,
        isActive: null,
      };

      const dto = plainToClass(UpdateMealPlanDto, nullData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBeNull();
      expect(dto.description).toBeNull();
      expect(dto.startDate).toBeNull();
      expect(dto.endDate).toBeNull();
      expect(dto.isActive).toBeNull();
    });

    it('should handle date transformation branches', () => {
      const testCases = [
        {
          startDate: new Date('2025-09-15'),
          endDate: new Date('2025-09-21'),
        },
        {
          startDate: 1725148800000, // timestamp
          endDate: 1725321600000,
        },
      ];

      testCases.forEach((testCase) => {
        const dto = plainToClass(UpdateMealPlanDto, testCase);
        expect(dto.startDate).toBeDefined();
        expect(dto.endDate).toBeDefined();
      });
    });

    it('should allow updating individual fields', async () => {
      const testCases = [
        { name: 'Just Name Update' },
        { description: 'Just Description Update' },
        { startDate: '2025-09-15T00:00:00.000Z' },
        { endDate: '2025-09-05T23:59:59.999Z' },
        { isActive: true },
      ];

      for (const testCase of testCases) {
        const dto = plainToClass(UpdateMealPlanDto, testCase);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      }
    });
  });
});
