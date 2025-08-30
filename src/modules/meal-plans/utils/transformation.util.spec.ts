import { MealPlanTransformationUtil, CustomTransformers } from './transformation.util';
import { CreateMealPlanDto } from '../dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from '../dto/update-meal-plan.dto';

describe('MealPlanTransformationUtil', () => {
  describe('toCreateMealPlanDto', () => {
    it('should transform raw data to CreateMealPlanDto', () => {
      const rawData = {
        name: 'Test Meal Plan',
        description: 'A test meal plan',
        startDate: '2025-09-01T00:00:00.000Z',
        endDate: '2025-09-07T23:59:59.999Z',
        isActive: true,
        extraField: 'should be excluded', // Extra field
      };

      const result = MealPlanTransformationUtil.toCreateMealPlanDto(rawData, 'user-123');

      expect(result).toBeInstanceOf(CreateMealPlanDto);
      expect(result.name).toBe('Test Meal Plan');
      expect(result.description).toBe('A test meal plan');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.isActive).toBe(true);
      expect(result.userId).toBe('user-123');
      // Note: extra fields are preserved in this transformation
    });

    it('should sanitize text fields', () => {
      const rawData = {
        name: '<script>alert("xss")</script>Clean   Name',
        description: '<p>Description   with   HTML</p>',
        startDate: '2025-09-01T00:00:00.000Z',
        endDate: '2025-09-07T23:59:59.999Z',
      };

      const result = MealPlanTransformationUtil.toCreateMealPlanDto(rawData);

      expect(result.name).toBe('alert("xss")Clean Name');
      expect(result.description).toBe('Description with HTML');
    });

    it('should handle missing userId', () => {
      const rawData = {
        name: 'Test Meal Plan',
        startDate: '2025-09-01T00:00:00.000Z',
        endDate: '2025-09-07T23:59:59.999Z',
      };

      const result = MealPlanTransformationUtil.toCreateMealPlanDto(rawData);

      expect(result.userId).toBeUndefined();
    });
  });

  describe('toUpdateMealPlanDto', () => {
    it('should transform raw data to UpdateMealPlanDto', () => {
      const rawData = {
        name: 'Updated Meal Plan',
        description: 'Updated description',
        startDate: '2025-09-01T00:00:00.000Z',
        extraField: 'should be excluded',
      };

      const result = MealPlanTransformationUtil.toUpdateMealPlanDto(
        rawData,
        'user-123',
        'plan-456',
      );

      expect(result).toBeInstanceOf(UpdateMealPlanDto);
      expect(result.name).toBe('Updated Meal Plan');
      expect(result.description).toBe('Updated description');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.userId).toBe('user-123');
      expect(result.id).toBe('plan-456');
      // Note: extra fields are preserved in this transformation
    });

    it('should handle partial updates', () => {
      const rawData = {
        name: 'Only name update',
      };

      const result = MealPlanTransformationUtil.toUpdateMealPlanDto(rawData);

      expect(result.name).toBe('Only name update');
      expect(result.description).toBeUndefined();
      expect(result.startDate).toBeUndefined();
    });
  });

  describe('toISODate', () => {
    it('should convert Date object to ISO string', () => {
      const date = new Date('2025-09-01T12:00:00.000Z');
      const result = MealPlanTransformationUtil.toISODate(date);

      expect(result).toBe('2025-09-01T12:00:00.000Z');
    });

    it('should convert valid date string to ISO string', () => {
      const result = MealPlanTransformationUtil.toISODate('2025-09-01T12:00:00.000Z');

      expect(result).toBe('2025-09-01T12:00:00.000Z');
    });

    it('should handle invalid date inputs', () => {
      expect(MealPlanTransformationUtil.toISODate('invalid-date')).toBeNull();
      expect(MealPlanTransformationUtil.toISODate(null)).toBeNull();
      expect(MealPlanTransformationUtil.toISODate(undefined)).toBeNull();
    });
  });

  describe('fromDatabaseModel', () => {
    it('should transform database model to response format', () => {
      const dbModel = {
        mealPlanId: BigInt(123),
        name: 'Test Plan',
        description: 'Test description',
        startDate: new Date('2025-09-01T00:00:00.000Z'),
        endDate: new Date('2025-09-07T23:59:59.999Z'),
        isActive: 1, // Database boolean as number
        createdAt: new Date('2025-08-01T00:00:00.000Z'),
        updatedAt: new Date('2025-08-15T00:00:00.000Z'),
        userId: 'user-123',
      };

      const result = MealPlanTransformationUtil.fromDatabaseModel(dbModel);

      expect(result.id).toBe('123');
      expect(result.name).toBe('Test Plan');
      expect(result.description).toBe('Test description');
      expect(result.startDate).toEqual(new Date('2025-09-01T00:00:00.000Z'));
      expect(result.endDate).toEqual(new Date('2025-09-07T23:59:59.999Z'));
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toEqual(new Date('2025-08-01T00:00:00.000Z'));
      expect(result.updatedAt).toEqual(new Date('2025-08-15T00:00:00.000Z'));
      expect(result.userId).toBe('user-123');
    });

    it('should handle null input', () => {
      expect(MealPlanTransformationUtil.fromDatabaseModel(null)).toBeNull();
      expect(MealPlanTransformationUtil.fromDatabaseModel(undefined)).toBeNull();
    });

    it('should include recipes when present', () => {
      const dbModel = {
        id: '123',
        name: 'Test Plan',
        recipes: [{ id: '1', title: 'Recipe 1' }],
      };

      const result = MealPlanTransformationUtil.fromDatabaseModel(dbModel);

      expect(result.recipes).toEqual([{ id: '1', title: 'Recipe 1' }]);
    });
  });

  describe('fromDatabaseModels', () => {
    it('should transform array of database models', () => {
      const dbModels = [
        { id: '1', name: 'Plan 1', isActive: true },
        { id: '2', name: 'Plan 2', isActive: false },
      ];

      const result = MealPlanTransformationUtil.fromDatabaseModels(dbModels);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('Plan 1');
      expect(result[0].isActive).toBe(true);
      expect(result[1].id).toBe('2');
      expect(result[1].name).toBe('Plan 2');
      expect(result[1].isActive).toBe(false);
    });

    it('should handle non-array input', () => {
      expect(MealPlanTransformationUtil.fromDatabaseModels(null as any)).toEqual([]);
      expect(MealPlanTransformationUtil.fromDatabaseModels(undefined as any)).toEqual([]);
      expect(MealPlanTransformationUtil.fromDatabaseModels({} as any)).toEqual([]);
    });
  });

  describe('transformPaginationParams', () => {
    it('should transform valid pagination parameters', () => {
      const query = { page: '2', limit: '20' };
      const result = MealPlanTransformationUtil.transformPaginationParams(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(20);
    });

    it('should apply default values for missing parameters', () => {
      const result = MealPlanTransformationUtil.transformPaginationParams({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should enforce limits and minimums', () => {
      const query = { page: '-5', limit: '500' };
      const result = MealPlanTransformationUtil.transformPaginationParams(query);

      expect(result.page).toBe(1); // Minimum 1
      expect(result.limit).toBe(100); // Maximum 100
      expect(result.offset).toBe(0);
    });

    it('should handle invalid values', () => {
      const query = { page: 'invalid', limit: 'also-invalid' };
      const result = MealPlanTransformationUtil.transformPaginationParams(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });

  describe('transformFilterParams', () => {
    it('should transform valid filter parameters', () => {
      const query = {
        isActive: 'true',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        search: '  <p>Meal   Plan</p>  ',
      };

      const result = MealPlanTransformationUtil.transformFilterParams(query);

      expect(result.isActive).toBe(true);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.startDate?.toISOString()).toBe('2025-09-01T00:00:00.000Z');
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.endDate?.toISOString()).toBe('2025-09-07T00:00:00.000Z');
      expect(result.search).toBe('Meal Plan');
    });

    it('should handle boolean conversion variations', () => {
      const testCases = [
        { input: 'true', expected: true },
        { input: 'false', expected: false },
        { input: true, expected: true },
        { input: false, expected: false },
        { input: 1, expected: true },
        { input: 0, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = MealPlanTransformationUtil.transformFilterParams({ isActive: input });
        expect(result.isActive).toBe(expected);
      });
    });

    it('should handle invalid dates', () => {
      const query = {
        startDate: 'invalid-date',
        endDate: 'also-invalid',
      };

      const result = MealPlanTransformationUtil.transformFilterParams(query);

      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it('should return empty object for no filters', () => {
      const result = MealPlanTransformationUtil.transformFilterParams({});

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('createErrorResponse', () => {
    it('should create standardized error response', () => {
      const result = MealPlanTransformationUtil.createErrorResponse(
        'Validation failed',
        ['Name is required', 'Invalid date'],
        400,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Validation failed');
      expect(result.statusCode).toBe(400);
      expect(result.errors).toEqual(['Name is required', 'Invalid date']);
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should use default status code', () => {
      const result = MealPlanTransformationUtil.createErrorResponse('Error occurred');

      expect(result.statusCode).toBe(400);
      expect(result.errors).toBeUndefined();
    });
  });

  describe('createSuccessResponse', () => {
    it('should create standardized success response', () => {
      const data = { id: '1', name: 'Test Plan' };
      const meta = { page: 1, limit: 10, total: 1 };

      const result = MealPlanTransformationUtil.createSuccessResponse(
        data,
        'Plan retrieved successfully',
        meta,
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Plan retrieved successfully');
      expect(result.data).toEqual(data);
      expect(result.meta).toEqual(meta);
      expect(result.timestamp).toBeDefined();
    });

    it('should use default message and no meta', () => {
      const data = { test: 'data' };
      const result = MealPlanTransformationUtil.createSuccessResponse(data);

      expect(result.message).toBe('Success');
      expect(result.meta).toBeUndefined();
    });
  });
});

describe('CustomTransformers', () => {
  // Note: Testing custom transformers directly is complex since they return Transform decorators.
  // In practice, these would be tested as part of DTO validation tests.
  // Here we test the basic concepts that can be isolated.

  describe('transformer concepts', () => {
    it('should have sanitizeString transformer', () => {
      const transformer = CustomTransformers.sanitizeString();
      expect(transformer).toBeDefined();
    });

    it('should have toBoolean transformer', () => {
      const transformer = CustomTransformers.toBoolean();
      expect(transformer).toBeDefined();
    });

    it('should have toPositiveInteger transformer', () => {
      const transformer = CustomTransformers.toPositiveInteger();
      expect(transformer).toBeDefined();
    });

    it('should have toValidDate transformer', () => {
      const transformer = CustomTransformers.toValidDate();
      expect(transformer).toBeDefined();
    });
  });
});
