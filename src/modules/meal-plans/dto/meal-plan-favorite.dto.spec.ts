import { describe, it, expect } from 'bun:test';
import { plainToClass } from 'class-transformer';
import {
  MealPlanFavoriteResponseDto,
  MealPlanFavoriteCheckResponseDto,
  PaginatedMealPlanFavoritesResponseDto,
  MealPlanFavoriteApiResponseDto,
  MealPlanFavoriteCheckApiResponseDto,
} from './meal-plan-favorite.dto';
import { MealPlanResponseDto } from './meal-plan-response.dto';

describe('MealPlanFavoriteResponseDto', () => {
  const validFavoriteData = {
    mealPlanId: '123',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    favoritedAt: '2025-08-29T10:00:00.000Z',
  };

  const validMealPlanData = {
    id: '123',
    userId: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Weekly Family Meal Plan',
    description: 'A healthy meal plan',
    startDate: '2025-08-29T00:00:00.000Z',
    endDate: '2025-09-05T23:59:59.999Z',
    isActive: true,
    createdAt: '2025-08-29T10:00:00.000Z',
    updatedAt: '2025-08-29T10:00:00.000Z',
  };

  describe('basic transformation', () => {
    it('should properly expose all fields', () => {
      const dto = plainToClass(MealPlanFavoriteResponseDto, validFavoriteData);

      expect(dto.mealPlanId).toBe(validFavoriteData.mealPlanId);
      expect(dto.userId).toBe(validFavoriteData.userId);
    });

    it('should transform favoritedAt string to Date object', () => {
      const dto = plainToClass(MealPlanFavoriteResponseDto, validFavoriteData);

      expect(dto.favoritedAt).toBeInstanceOf(Date);
      expect(dto.favoritedAt.toISOString()).toBe('2025-08-29T10:00:00.000Z');
    });

    it('should handle Date object as input for favoritedAt', () => {
      const dataWithDate = {
        ...validFavoriteData,
        favoritedAt: new Date('2025-08-29T10:00:00.000Z'),
      };

      const dto = plainToClass(MealPlanFavoriteResponseDto, dataWithDate);

      expect(dto.favoritedAt).toBeInstanceOf(Date);
      expect(dto.favoritedAt.toISOString()).toBe('2025-08-29T10:00:00.000Z');
    });
  });

  describe('nested meal plan transformation', () => {
    it('should properly transform nested mealPlan when included', () => {
      const dataWithMealPlan = {
        ...validFavoriteData,
        mealPlan: validMealPlanData,
      };

      const dto = plainToClass(MealPlanFavoriteResponseDto, dataWithMealPlan);

      expect(dto.mealPlan).toBeDefined();
      expect(dto.mealPlan).toBeInstanceOf(MealPlanResponseDto);
      expect(dto.mealPlan?.id).toBe(validMealPlanData.id);
      expect(dto.mealPlan?.name).toBe(validMealPlanData.name);
      expect(dto.mealPlan?.startDate).toBeInstanceOf(Date);
      expect(dto.mealPlan?.endDate).toBeInstanceOf(Date);
    });

    it('should handle missing mealPlan (undefined)', () => {
      const dto = plainToClass(MealPlanFavoriteResponseDto, validFavoriteData);

      expect(dto.mealPlan).toBeUndefined();
    });

    it('should handle null mealPlan', () => {
      const dataWithNullMealPlan = {
        ...validFavoriteData,
        mealPlan: null,
      };

      const dto = plainToClass(MealPlanFavoriteResponseDto, dataWithNullMealPlan);

      expect(dto.mealPlan).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle various UUID formats for userId', () => {
      const uuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ];

      uuids.forEach((userId) => {
        const data = { ...validFavoriteData, userId };
        const dto = plainToClass(MealPlanFavoriteResponseDto, data);
        expect(dto.userId).toBe(userId);
      });
    });

    it('should handle different mealPlanId formats', () => {
      const ids = ['1', '123', '999999'];

      ids.forEach((mealPlanId) => {
        const data = { ...validFavoriteData, mealPlanId };
        const dto = plainToClass(MealPlanFavoriteResponseDto, data);
        expect(dto.mealPlanId).toBe(mealPlanId);
      });
    });
  });
});

describe('MealPlanFavoriteCheckResponseDto', () => {
  describe('when favorited', () => {
    it('should properly expose isFavorited as true with favoritedAt', () => {
      const data = {
        isFavorited: true,
        favoritedAt: '2025-08-29T10:00:00.000Z',
      };

      const dto = plainToClass(MealPlanFavoriteCheckResponseDto, data);

      expect(dto.isFavorited).toBe(true);
      expect(dto.favoritedAt).toBeInstanceOf(Date);
      expect(dto.favoritedAt?.toISOString()).toBe('2025-08-29T10:00:00.000Z');
    });

    it('should handle Date object as input for favoritedAt', () => {
      const data = {
        isFavorited: true,
        favoritedAt: new Date('2025-08-29T10:00:00.000Z'),
      };

      const dto = plainToClass(MealPlanFavoriteCheckResponseDto, data);

      expect(dto.favoritedAt).toBeInstanceOf(Date);
    });
  });

  describe('when not favorited', () => {
    it('should properly expose isFavorited as false with null favoritedAt', () => {
      const data = {
        isFavorited: false,
        favoritedAt: null,
      };

      const dto = plainToClass(MealPlanFavoriteCheckResponseDto, data);

      expect(dto.isFavorited).toBe(false);
      expect(dto.favoritedAt).toBeNull();
    });

    it('should handle undefined favoritedAt', () => {
      const data = {
        isFavorited: false,
      };

      const dto = plainToClass(MealPlanFavoriteCheckResponseDto, data);

      expect(dto.isFavorited).toBe(false);
      expect(dto.favoritedAt).toBeUndefined();
    });
  });
});

describe('PaginatedMealPlanFavoritesResponseDto', () => {
  const validPaginatedData = {
    success: true,
    data: [
      {
        mealPlanId: '123',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        favoritedAt: '2025-08-29T10:00:00.000Z',
      },
      {
        mealPlanId: '456',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        favoritedAt: '2025-08-30T10:00:00.000Z',
      },
    ],
    meta: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  };

  describe('basic transformation', () => {
    it('should properly expose success and meta fields', () => {
      const dto = plainToClass(PaginatedMealPlanFavoritesResponseDto, validPaginatedData);

      expect(dto.success).toBe(true);
      expect(dto.meta.page).toBe(1);
      expect(dto.meta.limit).toBe(20);
      expect(dto.meta.total).toBe(2);
      expect(dto.meta.totalPages).toBe(1);
      expect(dto.meta.hasNext).toBe(false);
      expect(dto.meta.hasPrevious).toBe(false);
    });

    it('should properly transform data array items', () => {
      const dto = plainToClass(PaginatedMealPlanFavoritesResponseDto, validPaginatedData);

      expect(dto.data).toHaveLength(2);
      expect(dto.data[0]).toBeInstanceOf(MealPlanFavoriteResponseDto);
      expect(dto.data[1]).toBeInstanceOf(MealPlanFavoriteResponseDto);

      expect(dto.data[0]?.mealPlanId).toBe('123');
      expect(dto.data[0]?.favoritedAt).toBeInstanceOf(Date);

      expect(dto.data[1]?.mealPlanId).toBe('456');
      expect(dto.data[1]?.favoritedAt).toBeInstanceOf(Date);
    });
  });

  describe('empty results', () => {
    it('should handle empty data array', () => {
      const emptyData = {
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };

      const dto = plainToClass(PaginatedMealPlanFavoritesResponseDto, emptyData);

      expect(dto.data).toEqual([]);
      expect(dto.meta.total).toBe(0);
      expect(dto.meta.totalPages).toBe(0);
    });
  });

  describe('pagination scenarios', () => {
    it('should handle hasNext true on first page', () => {
      const dataWithNext = {
        ...validPaginatedData,
        meta: {
          ...validPaginatedData.meta,
          total: 50,
          totalPages: 3,
          hasNext: true,
          hasPrevious: false,
        },
      };

      const dto = plainToClass(PaginatedMealPlanFavoritesResponseDto, dataWithNext);

      expect(dto.meta.hasNext).toBe(true);
      expect(dto.meta.hasPrevious).toBe(false);
    });

    it('should handle middle page with both hasNext and hasPrevious', () => {
      const middlePageData = {
        ...validPaginatedData,
        meta: {
          page: 2,
          limit: 20,
          total: 50,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true,
        },
      };

      const dto = plainToClass(PaginatedMealPlanFavoritesResponseDto, middlePageData);

      expect(dto.meta.page).toBe(2);
      expect(dto.meta.hasNext).toBe(true);
      expect(dto.meta.hasPrevious).toBe(true);
    });
  });
});

describe('MealPlanFavoriteApiResponseDto', () => {
  const validApiResponse = {
    success: true,
    data: {
      mealPlanId: '123',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      favoritedAt: '2025-08-29T10:00:00.000Z',
    },
    message: 'Meal plan added to favorites successfully',
  };

  describe('basic transformation', () => {
    it('should properly expose all fields', () => {
      const dto = plainToClass(MealPlanFavoriteApiResponseDto, validApiResponse);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Meal plan added to favorites successfully');
    });

    it('should properly transform nested data', () => {
      const dto = plainToClass(MealPlanFavoriteApiResponseDto, validApiResponse);

      expect(dto.data).toBeInstanceOf(MealPlanFavoriteResponseDto);
      expect(dto.data.mealPlanId).toBe('123');
      expect(dto.data.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(dto.data.favoritedAt).toBeInstanceOf(Date);
    });
  });

  describe('optional message', () => {
    it('should handle missing message', () => {
      const dataWithoutMessage = {
        success: true,
        data: validApiResponse.data,
      };

      const dto = plainToClass(MealPlanFavoriteApiResponseDto, dataWithoutMessage);

      expect(dto.success).toBe(true);
      expect(dto.message).toBeUndefined();
    });

    it('should handle different message values', () => {
      const messages = ['Meal plan added to favorites successfully', 'Favorite created', ''];

      messages.forEach((message) => {
        const data = { ...validApiResponse, message };
        const dto = plainToClass(MealPlanFavoriteApiResponseDto, data);
        expect(dto.message).toBe(message);
      });
    });
  });
});

describe('MealPlanFavoriteCheckApiResponseDto', () => {
  describe('when favorited', () => {
    it('should properly transform response with favorited status', () => {
      const data = {
        success: true,
        data: {
          isFavorited: true,
          favoritedAt: '2025-08-29T10:00:00.000Z',
        },
      };

      const dto = plainToClass(MealPlanFavoriteCheckApiResponseDto, data);

      expect(dto.success).toBe(true);
      expect(dto.data).toBeInstanceOf(MealPlanFavoriteCheckResponseDto);
      expect(dto.data.isFavorited).toBe(true);
      expect(dto.data.favoritedAt).toBeInstanceOf(Date);
    });
  });

  describe('when not favorited', () => {
    it('should properly transform response with not favorited status', () => {
      const data = {
        success: true,
        data: {
          isFavorited: false,
          favoritedAt: null,
        },
      };

      const dto = plainToClass(MealPlanFavoriteCheckApiResponseDto, data);

      expect(dto.success).toBe(true);
      expect(dto.data).toBeInstanceOf(MealPlanFavoriteCheckResponseDto);
      expect(dto.data.isFavorited).toBe(false);
      expect(dto.data.favoritedAt).toBeNull();
    });
  });
});
