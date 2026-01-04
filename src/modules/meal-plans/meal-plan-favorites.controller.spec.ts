import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { MealPlanFavoritesController } from './meal-plan-favorites.controller';
import { MealPlanFavoritesService } from './meal-plan-favorites.service';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/jwt-payload.interface';

describe('MealPlanFavoritesController', () => {
  let controller: MealPlanFavoritesController;
  let service: {
    listFavorites: Mock<(...args: unknown[]) => unknown>;
    addFavorite: Mock<(...args: unknown[]) => unknown>;
    checkFavorite: Mock<(...args: unknown[]) => unknown>;
    removeFavorite: Mock<(...args: unknown[]) => unknown>;
  };

  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const testMealPlanId = '123';

  const mockUser: AuthenticatedUser = {
    id: testUserId,
    sub: testUserId,
    clientId: 'test-client',
    scopes: ['read', 'write'],
    exp: Date.now() + 3600000,
  };

  const mockService = {
    listFavorites: mock(() => {}),
    addFavorite: mock(() => {}),
    checkFavorite: mock(() => {}),
    removeFavorite: mock(() => {}),
  };

  beforeEach(async () => {
    mockService.listFavorites.mockReset();
    mockService.addFavorite.mockReset();
    mockService.checkFavorite.mockReset();
    mockService.removeFavorite.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealPlanFavoritesController],
      providers: [
        {
          provide: MealPlanFavoritesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MealPlanFavoritesController>(MealPlanFavoritesController);
    service = module.get(MealPlanFavoritesService) as typeof service;
  });

  describe('listFavorites', () => {
    it('should call service with correct parameters', async () => {
      const expectedResponse = {
        success: true,
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      };

      service.listFavorites.mockResolvedValue(expectedResponse as never);

      const result = await controller.listFavorites(
        { page: 1, limit: 20 },
        'true',
        'favoritedAt',
        'desc',
        mockUser,
      );

      expect(result).toEqual(expectedResponse);
      expect(service.listFavorites).toHaveBeenCalledWith(
        testUserId,
        { page: 1, limit: 20 },
        true,
        'favoritedAt',
        'desc',
      );
    });

    it('should default includeMealPlan to false when not provided', async () => {
      const expectedResponse = {
        success: true,
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      };

      service.listFavorites.mockResolvedValue(expectedResponse as never);

      await controller.listFavorites(
        { page: 1, limit: 20 },
        undefined,
        undefined,
        undefined,
        mockUser,
      );

      expect(service.listFavorites).toHaveBeenCalledWith(
        testUserId,
        { page: 1, limit: 20 },
        false,
        'favoritedAt',
        'desc',
      );
    });
  });

  describe('addFavorite', () => {
    it('should call service with correct parameters', async () => {
      const expectedResponse = {
        success: true,
        data: { mealPlanId: testMealPlanId, userId: testUserId, favoritedAt: new Date() },
        message: 'Meal plan added to favorites successfully',
      };

      service.addFavorite.mockResolvedValue(expectedResponse as never);

      const result = await controller.addFavorite(testMealPlanId, mockUser);

      expect(result).toEqual(expectedResponse);
      expect(service.addFavorite).toHaveBeenCalledWith(testUserId, testMealPlanId);
    });
  });

  describe('checkFavorite', () => {
    it('should call service with correct parameters', async () => {
      const expectedResponse = {
        success: true,
        data: { isFavorited: true, favoritedAt: new Date() },
      };

      service.checkFavorite.mockResolvedValue(expectedResponse as never);

      const result = await controller.checkFavorite(testMealPlanId, mockUser);

      expect(result).toEqual(expectedResponse);
      expect(service.checkFavorite).toHaveBeenCalledWith(testUserId, testMealPlanId);
    });
  });

  describe('removeFavorite', () => {
    it('should call service with correct parameters', async () => {
      service.removeFavorite.mockResolvedValue(undefined as never);

      await controller.removeFavorite(testMealPlanId, mockUser);

      expect(service.removeFavorite).toHaveBeenCalledWith(testUserId, testMealPlanId);
    });
  });
});
