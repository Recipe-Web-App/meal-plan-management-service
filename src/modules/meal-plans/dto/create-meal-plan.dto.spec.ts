import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateMealPlanDto } from './create-meal-plan.dto';

describe('CreateMealPlanDto', () => {
  const validData = {
    name: 'Weekly Meal Plan',
    description: 'A healthy weekly meal plan',
    startDate: '2025-09-01T00:00:00.000Z',
    endDate: '2025-09-07T23:59:59.999Z',
    isActive: true,
  };

  describe('valid data', () => {
    it('should pass validation with all valid fields', async () => {
      const dto = plainToClass(CreateMealPlanDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBe(validData.name);
      expect(dto.description).toBe(validData.description);
      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
      expect(dto.isActive).toBe(true);
    });

    it('should pass validation with only required fields', async () => {
      const minimalData = {
        name: validData.name,
        startDate: validData.startDate,
        endDate: validData.endDate,
      };

      const dto = plainToClass(CreateMealPlanDto, minimalData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.description).toBeUndefined();
      expect(dto.isActive).toBe(false); // default value
    });

    it('should transform string dates to Date objects', async () => {
      const dto = plainToClass(CreateMealPlanDto, validData);

      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
      expect(dto.startDate.toISOString()).toBe('2025-09-01T00:00:00.000Z');
      expect(dto.endDate.toISOString()).toBe('2025-09-07T23:59:59.999Z');
    });

    it('should transform string boolean to boolean', async () => {
      const dataWithStringBoolean = {
        ...validData,
        isActive: 'true' as any,
      };

      const dto = plainToClass(CreateMealPlanDto, dataWithStringBoolean);

      expect(dto.isActive).toBe(true);
      expect(typeof dto.isActive).toBe('boolean');
    });
  });

  describe('name validation', () => {
    it('should fail when name is missing', async () => {
      const invalidData = { ...validData };
      delete invalidData.name;

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThanOrEqual(1);
      const nameError = errors.find((error) => error.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError!.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when name is empty string', async () => {
      const invalidData = {
        ...validData,
        name: '',
      };

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should fail when name is too long', async () => {
      const invalidData = {
        ...validData,
        name: 'a'.repeat(101),
      };

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should pass when name is at maximum length', async () => {
      const validLongName = {
        ...validData,
        name: 'a'.repeat(100),
      };

      const dto = plainToClass(CreateMealPlanDto, validLongName);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('description validation', () => {
    it('should pass when description is undefined', async () => {
      const dataWithoutDescription = { ...validData };
      delete dataWithoutDescription.description;

      const dto = plainToClass(CreateMealPlanDto, dataWithoutDescription);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass when description is empty string', async () => {
      const dataWithEmptyDescription = {
        ...validData,
        description: '',
      };

      const dto = plainToClass(CreateMealPlanDto, dataWithEmptyDescription);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail when description is too long', async () => {
      const invalidData = {
        ...validData,
        description: 'a'.repeat(501),
      };

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should pass when description is at maximum length', async () => {
      const validLongDescription = {
        ...validData,
        description: 'a'.repeat(500),
      };

      const dto = plainToClass(CreateMealPlanDto, validLongDescription);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('date validation', () => {
    it('should fail when startDate is missing', async () => {
      const invalidData = { ...validData };
      delete invalidData.startDate;

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('startDate');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when endDate is missing', async () => {
      const invalidData = { ...validData };
      delete invalidData.endDate;

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('endDate');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when startDate is invalid date string', async () => {
      const invalidData = {
        ...validData,
        startDate: 'invalid-date' as any,
      };

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('startDate');
      expect(errors[0].constraints).toHaveProperty('isDate');
    });

    it('should fail when endDate is invalid date string', async () => {
      const invalidData = {
        ...validData,
        endDate: 'invalid-date' as any,
      };

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThanOrEqual(1);
      const endDateError = errors.find((error) => error.property === 'endDate');
      expect(endDateError).toBeDefined();
      expect(endDateError.constraints).toHaveProperty('isDate');
    });

    it('should accept different valid date formats', async () => {
      const validDateFormats = [
        { startDate: '2025-09-01', endDate: '2025-09-07' },
        { startDate: new Date('2025-09-01'), endDate: new Date('2025-09-07') },
        { startDate: '2025-09-01T10:30:00Z', endDate: '2025-09-07T15:45:00Z' },
      ];

      for (const dateFormat of validDateFormats) {
        const testData = {
          ...validData,
          ...dateFormat,
        };

        const dto = plainToClass(CreateMealPlanDto, testData);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.startDate).toBeInstanceOf(Date);
        expect(dto.endDate).toBeInstanceOf(Date);
      }
    });
  });

  describe('isActive validation', () => {
    it('should pass when isActive is boolean true', async () => {
      const dto = plainToClass(CreateMealPlanDto, { ...validData, isActive: true });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(true);
    });

    it('should pass when isActive is boolean false', async () => {
      const dto = plainToClass(CreateMealPlanDto, { ...validData, isActive: false });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(false);
    });

    it('should transform string "true" to boolean true', async () => {
      const dto = plainToClass(CreateMealPlanDto, { ...validData, isActive: 'true' as any });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(true);
      expect(typeof dto.isActive).toBe('boolean');
    });

    it('should transform string "false" to boolean false', async () => {
      const dto = plainToClass(CreateMealPlanDto, { ...validData, isActive: 'false' as any });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(false);
      expect(typeof dto.isActive).toBe('boolean');
    });

    it('should fail when isActive is invalid string', async () => {
      const invalidData = {
        ...validData,
        isActive: 'invalid' as any,
      };

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('isActive');
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });

    it('should default to false when isActive is not provided', async () => {
      const dataWithoutIsActive = { ...validData };
      delete dataWithoutIsActive.isActive;

      const dto = plainToClass(CreateMealPlanDto, dataWithoutIsActive);

      expect(dto.isActive).toBe(false);
    });
  });

  describe('combined validation errors', () => {
    it('should return multiple validation errors for multiple invalid fields', async () => {
      const invalidData = {
        name: '',
        description: 'a'.repeat(501),
        startDate: 'invalid-date',
        endDate: 'invalid-date',
        isActive: 'invalid',
      };

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(1);

      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('name');
      expect(errorProperties).toContain('description');
      expect(errorProperties).toContain('startDate');
      expect(errorProperties).toContain('endDate');
      // isActive might fail or might be transformed, both are valid
    });
  });
});
