import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MealPlanFavoritesService } from './meal-plan-favorites.service';
import { MealPlanFavoritesRepository } from './meal-plan-favorites.repository';

describe('MealPlanFavoritesService', () => {
  let service: MealPlanFavoritesService;
  let repository: {
    create: Mock<(...args: unknown[]) => unknown>;
    findByUserAndMealPlan: Mock<(...args: unknown[]) => unknown>;
    findByUser: Mock<(...args: unknown[]) => unknown>;
    countByUser: Mock<(...args: unknown[]) => unknown>;
    delete: Mock<(...args: unknown[]) => unknown>;
    mealPlanExists: Mock<(...args: unknown[]) => unknown>;
  };

  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const testMealPlanId = '123';
  const testMealPlanIdBigInt = BigInt(123);

  const mockRepository = {
    create: mock(() => {}),
    findByUserAndMealPlan: mock(() => {}),
    findByUser: mock(() => {}),
    countByUser: mock(() => {}),
    delete: mock(() => {}),
    mealPlanExists: mock(() => {}),
  };

  beforeEach(async () => {
    mockRepository.create.mockReset();
    mockRepository.findByUserAndMealPlan.mockReset();
    mockRepository.findByUser.mockReset();
    mockRepository.countByUser.mockReset();
    mockRepository.delete.mockReset();
    mockRepository.mealPlanExists.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlanFavoritesService,
        {
          provide: MealPlanFavoritesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MealPlanFavoritesService>(MealPlanFavoritesService);
    repository = module.get(MealPlanFavoritesRepository);
  });

  describe('listFavorites', () => {
    it('should return paginated favorites', async () => {
      const favorites = [
        { userId: testUserId, mealPlanId: BigInt(1), favoritedAt: new Date() },
        { userId: testUserId, mealPlanId: BigInt(2), favoritedAt: new Date() },
      ];

      repository.findByUser.mockResolvedValue(favorites as never);
      repository.countByUser.mockResolvedValue(2 as never);

      const result = await service.listFavorites(testUserId, { page: 1, limit: 20 }, false);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should handle empty results', async () => {
      repository.findByUser.mockResolvedValue([] as never);
      repository.countByUser.mockResolvedValue(0 as never);

      const result = await service.listFavorites(testUserId, { page: 1, limit: 20 }, false);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('addFavorite', () => {
    it('should add meal plan to favorites', async () => {
      const createdFavorite = {
        userId: testUserId,
        mealPlanId: testMealPlanIdBigInt,
        favoritedAt: new Date(),
      };

      repository.mealPlanExists.mockResolvedValue(true as never);
      repository.findByUserAndMealPlan.mockResolvedValue(null as never);
      repository.create.mockResolvedValue(createdFavorite as never);

      const result = await service.addFavorite(testUserId, testMealPlanId);

      expect(result.success).toBe(true);
      expect(result.data.mealPlanId).toBe(testMealPlanId);
      expect(result.message).toBe('Meal plan added to favorites successfully');
    });

    it('should throw NotFoundException when meal plan does not exist', async () => {
      repository.mealPlanExists.mockResolvedValue(false as never);

      await expect(service.addFavorite(testUserId, testMealPlanId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when already favorited', async () => {
      repository.mealPlanExists.mockResolvedValue(true as never);
      repository.findByUserAndMealPlan.mockResolvedValue({
        userId: testUserId,
        mealPlanId: testMealPlanIdBigInt,
        favoritedAt: new Date(),
      } as never);

      await expect(service.addFavorite(testUserId, testMealPlanId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('checkFavorite', () => {
    it('should return isFavorited true when favorited', async () => {
      const favorite = {
        userId: testUserId,
        mealPlanId: testMealPlanIdBigInt,
        favoritedAt: new Date('2025-01-01'),
      };

      repository.findByUserAndMealPlan.mockResolvedValue(favorite as never);

      const result = await service.checkFavorite(testUserId, testMealPlanId);

      expect(result.success).toBe(true);
      expect(result.data.isFavorited).toBe(true);
      expect(result.data.favoritedAt).toEqual(favorite.favoritedAt);
    });

    it('should return isFavorited false when not favorited', async () => {
      repository.findByUserAndMealPlan.mockResolvedValue(null as never);

      const result = await service.checkFavorite(testUserId, testMealPlanId);

      expect(result.success).toBe(true);
      expect(result.data.isFavorited).toBe(false);
      expect(result.data.favoritedAt).toBeNull();
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite successfully', async () => {
      repository.findByUserAndMealPlan.mockResolvedValue({
        userId: testUserId,
        mealPlanId: testMealPlanIdBigInt,
        favoritedAt: new Date(),
      } as never);
      repository.delete.mockResolvedValue(undefined as never);

      await expect(service.removeFavorite(testUserId, testMealPlanId)).resolves.toBeUndefined();

      expect(repository.delete).toHaveBeenCalledWith(testUserId, testMealPlanIdBigInt);
    });

    it('should throw NotFoundException when favorite does not exist', async () => {
      repository.findByUserAndMealPlan.mockResolvedValue(null as never);

      await expect(service.removeFavorite(testUserId, testMealPlanId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('parseMealPlanId (via public methods)', () => {
    it('should throw NotFoundException for invalid meal plan ID', async () => {
      await expect(service.checkFavorite(testUserId, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should handle valid BigInt string IDs', async () => {
      repository.findByUserAndMealPlan.mockResolvedValue(null as never);

      const result = await service.checkFavorite(testUserId, '999999999999');

      expect(result.data.isFavorited).toBe(false);
    });
  });
});
