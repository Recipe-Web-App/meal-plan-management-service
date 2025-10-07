import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateMealPlanDto } from './create-meal-plan.dto';

describe('CreateMealPlanDto', () => {
  // Helper function to get future dates for testing
  const getFutureDates = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // 1 week from now
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // 6 days after start
    endDate.setHours(23, 59, 59, 999);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const validData = {
    name: 'Weekly Meal Plan',
    description: 'A healthy weekly meal plan',
    ...getFutureDates(),
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
      expect(dto.startDate.toISOString()).toBe(validData.startDate);
      expect(dto.endDate.toISOString()).toBe(validData.endDate);
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
        name: 'a'.repeat(256),
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
        name: 'a'.repeat(255),
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
        description: 'a'.repeat(1001),
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
        description: 'a'.repeat(1000),
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

    it('should fail when startDate is invalid date string', () => {
      const invalidData = {
        ...validData,
        startDate: 'invalid-date' as any,
      };

      expect(() => {
        plainToClass(CreateMealPlanDto, invalidData);
      }).toThrow('Invalid date format');
    });

    it('should fail when endDate is invalid date string', () => {
      const invalidData = {
        ...validData,
        endDate: 'invalid-date' as any,
      };

      expect(() => {
        plainToClass(CreateMealPlanDto, invalidData);
      }).toThrow('Invalid date format');
    });

    it('should accept different valid date formats', async () => {
      const dates = getFutureDates();
      const startDateOnly = dates.startDate.split('T')[0];
      const endDateOnly = dates.endDate.split('T')[0];

      const validDateFormats = [
        { startDate: startDateOnly, endDate: endDateOnly },
        { startDate: new Date(dates.startDate), endDate: new Date(dates.endDate) },
        { startDate: dates.startDate, endDate: dates.endDate },
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

    it('should throw error when startDate transforms to Invalid Date', () => {
      const invalidData = {
        ...validData,
        startDate: 'NaN',
      };

      // Transform should throw when Type decorator produces Invalid Date
      expect(() => {
        plainToClass(CreateMealPlanDto, invalidData);
      }).toThrow('Invalid date format');
    });

    it('should throw error when endDate transforms to Invalid Date', () => {
      const invalidData = {
        ...validData,
        endDate: 'NaN',
      };

      // Transform should throw when Type decorator produces Invalid Date
      expect(() => {
        plainToClass(CreateMealPlanDto, invalidData);
      }).toThrow('Invalid date format');
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

  describe('date transformation edge cases', () => {
    it('should handle date transformation with non-string values', () => {
      const dates = getFutureDates();
      const testCases = [
        {
          name: 'Test Plan',
          startDate: new Date(dates.startDate),
          endDate: new Date(dates.endDate),
        },
        {
          name: 'Test Plan 2',
          startDate: 123456789,
          endDate: 987654321,
        },
      ];

      testCases.forEach((testCase) => {
        const dto = plainToClass(CreateMealPlanDto, testCase);
        expect(dto.startDate).toBeDefined();
        expect(dto.endDate).toBeDefined();
      });
    });
  });

  describe('combined validation errors', () => {
    it('should return multiple validation errors for multiple invalid fields', async () => {
      const dates = getFutureDates();
      const invalidData = {
        name: '',
        description: 'a'.repeat(1001),
        startDate: dates.endDate, // End date as start - wrong order
        endDate: dates.startDate, // Start date as end - wrong order
        isActive: 'invalid',
      };

      const dto = plainToClass(CreateMealPlanDto, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(1);

      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('name');
      expect(errorProperties).toContain('description');
    });
  });
});
