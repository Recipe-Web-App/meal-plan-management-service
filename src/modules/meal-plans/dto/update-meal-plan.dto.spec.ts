import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateMealPlanDto } from './update-meal-plan.dto';

describe('UpdateMealPlanDto', () => {
  describe('valid data', () => {
    it('should pass validation with all valid fields', async () => {
      const validData = {
        name: 'Updated Weekly Meal Plan',
        description: 'An updated healthy weekly meal plan',
        startDate: '2025-08-29T00:00:00.000Z',
        endDate: '2025-09-05T23:59:59.999Z',
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
        startDate: '2025-08-29T00:00:00.000Z',
        endDate: '2025-09-05T23:59:59.999Z',
      };

      const dto = plainToClass(UpdateMealPlanDto, data);

      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
      expect(dto.startDate?.toISOString()).toBe('2025-08-29T00:00:00.000Z');
      expect(dto.endDate?.toISOString()).toBe('2025-09-05T23:59:59.999Z');
    });

    it('should transform string boolean to boolean', async () => {
      const data = {
        isActive: 'true' as any,
      };

      const dto = plainToClass(UpdateMealPlanDto, data);

      expect(dto.isActive).toBe(true);
      expect(typeof dto.isActive).toBe('boolean');
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
      const invalidData = { name: 'a'.repeat(101) };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should pass when name is at maximum length', async () => {
      const validData = { name: 'a'.repeat(100) };

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
      const invalidData = { description: 'a'.repeat(501) };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should pass when description is at maximum length', async () => {
      const validData = { description: 'a'.repeat(500) };

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
    it('should fail when startDate is invalid date string', async () => {
      const invalidData = { startDate: 'invalid-date' as any };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('startDate');
      expect(errors[0].constraints).toHaveProperty('isDate');
    });

    it('should fail when endDate is invalid date string', async () => {
      const invalidData = { endDate: 'invalid-date' as any };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('endDate');
      expect(errors[0].constraints).toHaveProperty('isDate');
    });

    it('should accept different valid date formats', async () => {
      const validDateFormats = [
        { startDate: '2025-08-29', endDate: '2025-09-05' },
        { startDate: new Date('2025-08-29'), endDate: new Date('2025-09-05') },
        { startDate: '2025-08-29T10:30:00Z', endDate: '2025-09-05T15:45:00Z' },
      ];

      for (const dateFormat of validDateFormats) {
        const dto = plainToClass(UpdateMealPlanDto, dateFormat);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.startDate).toBeInstanceOf(Date);
        expect(dto.endDate).toBeInstanceOf(Date);
      }
    });

    it('should handle only one date field being provided', async () => {
      const startOnlyData = { startDate: '2025-08-29T00:00:00.000Z' };
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

  describe('isActive validation', () => {
    it('should pass when isActive is boolean true', async () => {
      const dto = plainToClass(UpdateMealPlanDto, { isActive: true });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(true);
    });

    it('should pass when isActive is boolean false', async () => {
      const dto = plainToClass(UpdateMealPlanDto, { isActive: false });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(false);
    });

    it('should transform string "true" to boolean true', async () => {
      const dto = plainToClass(UpdateMealPlanDto, { isActive: 'true' as any });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(true);
      expect(typeof dto.isActive).toBe('boolean');
    });

    it('should transform string "false" to boolean false', async () => {
      const dto = plainToClass(UpdateMealPlanDto, { isActive: 'false' as any });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(false);
      expect(typeof dto.isActive).toBe('boolean');
    });

    it('should fail when isActive is invalid string', async () => {
      const invalidData = { isActive: 'invalid' as any };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('isActive');
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });

    it('should fail when isActive is number', async () => {
      const invalidData = { isActive: 1 as any };

      const dto = plainToClass(UpdateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('isActive');
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });
  });

  describe('combined scenarios', () => {
    it('should handle mixed valid and invalid fields', async () => {
      const mixedData = {
        name: 'Valid Name',
        description: 'a'.repeat(501), // invalid
        startDate: '2025-08-29T00:00:00.000Z', // valid
        endDate: 'invalid-date', // invalid
        isActive: true, // valid
      };

      const dto = plainToClass(UpdateMealPlanDto, mixedData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(2);

      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('description');
      expect(errorProperties).toContain('endDate');
      expect(errorProperties).not.toContain('name');
      expect(errorProperties).not.toContain('startDate');
      expect(errorProperties).not.toContain('isActive');
    });

    it('should allow updating individual fields', async () => {
      const testCases = [
        { name: 'Just Name Update' },
        { description: 'Just Description Update' },
        { startDate: '2025-08-29T00:00:00.000Z' },
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
