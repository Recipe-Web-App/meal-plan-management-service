import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/config/database.config';
import { MealPlanFavoritesRepository } from './meal-plan-favorites.repository';

describe('MealPlanFavoritesRepository', () => {
  let repository: MealPlanFavoritesRepository;
  let prisma: {
    mealPlanFavorite: {
      create: Mock<(...args: unknown[]) => unknown>;
      findUnique: Mock<(...args: unknown[]) => unknown>;
      findMany: Mock<(...args: unknown[]) => unknown>;
      count: Mock<(...args: unknown[]) => unknown>;
      delete: Mock<(...args: unknown[]) => unknown>;
    };
    mealPlan: {
      count: Mock<(...args: unknown[]) => unknown>;
    };
  };

  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const testMealPlanId = BigInt(123);

  const mockPrismaService = {
    mealPlanFavorite: {
      create: mock(() => {}),
      findUnique: mock(() => {}),
      findMany: mock(() => {}),
      count: mock(() => {}),
      delete: mock(() => {}),
    },
    mealPlan: {
      count: mock(() => {}),
    },
  };

  beforeEach(async () => {
    mockPrismaService.mealPlanFavorite.create.mockReset();
    mockPrismaService.mealPlanFavorite.findUnique.mockReset();
    mockPrismaService.mealPlanFavorite.findMany.mockReset();
    mockPrismaService.mealPlanFavorite.count.mockReset();
    mockPrismaService.mealPlanFavorite.delete.mockReset();
    mockPrismaService.mealPlan.count.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlanFavoritesRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<MealPlanFavoritesRepository>(MealPlanFavoritesRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a favorite', async () => {
      const expectedFavorite = {
        userId: testUserId,
        mealPlanId: testMealPlanId,
        favoritedAt: new Date(),
      };

      prisma.mealPlanFavorite.create.mockResolvedValue(expectedFavorite as never);

      const result = await repository.create(testUserId, testMealPlanId);

      expect(result).toEqual(expectedFavorite);
      expect(prisma.mealPlanFavorite.create).toHaveBeenCalledWith({
        data: {
          userId: testUserId,
          mealPlanId: testMealPlanId,
        },
      });
    });
  });

  describe('findByUserAndMealPlan', () => {
    it('should return favorite when found', async () => {
      const expectedFavorite = {
        userId: testUserId,
        mealPlanId: testMealPlanId,
        favoritedAt: new Date(),
      };

      prisma.mealPlanFavorite.findUnique.mockResolvedValue(expectedFavorite as never);

      const result = await repository.findByUserAndMealPlan(testUserId, testMealPlanId);

      expect(result).toEqual(expectedFavorite);
      expect(prisma.mealPlanFavorite.findUnique).toHaveBeenCalledWith({
        where: {
          userId_mealPlanId: {
            userId: testUserId,
            mealPlanId: testMealPlanId,
          },
        },
      });
    });

    it('should return null when not found', async () => {
      prisma.mealPlanFavorite.findUnique.mockResolvedValue(null as never);

      const result = await repository.findByUserAndMealPlan(testUserId, testMealPlanId);

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return paginated favorites without meal plan details', async () => {
      const expectedFavorites = [
        { userId: testUserId, mealPlanId: BigInt(1), favoritedAt: new Date() },
        { userId: testUserId, mealPlanId: BigInt(2), favoritedAt: new Date() },
      ];

      prisma.mealPlanFavorite.findMany.mockResolvedValue(expectedFavorites as never);

      const result = await repository.findByUser(testUserId, {
        skip: 0,
        take: 20,
        orderBy: { favoritedAt: 'desc' },
        includeMealPlan: false,
      });

      expect(result).toEqual(expectedFavorites);
      expect(prisma.mealPlanFavorite.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        skip: 0,
        take: 20,
        orderBy: { favoritedAt: 'desc' },
      });
    });

    it('should return favorites with meal plan details when requested', async () => {
      const expectedFavorites = [
        {
          userId: testUserId,
          mealPlanId: BigInt(1),
          favoritedAt: new Date(),
          mealPlan: { mealPlanId: BigInt(1), name: 'Test Plan' },
        },
      ];

      prisma.mealPlanFavorite.findMany.mockResolvedValue(expectedFavorites as never);

      const result = await repository.findByUser(testUserId, {
        skip: 0,
        take: 20,
        orderBy: { favoritedAt: 'desc' },
        includeMealPlan: true,
      });

      expect(result).toEqual(expectedFavorites);
      expect(prisma.mealPlanFavorite.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        skip: 0,
        take: 20,
        orderBy: { favoritedAt: 'desc' },
        include: { mealPlan: true },
      });
    });
  });

  describe('countByUser', () => {
    it('should return count of favorites for user', async () => {
      prisma.mealPlanFavorite.count.mockResolvedValue(5 as never);

      const result = await repository.countByUser(testUserId);

      expect(result).toBe(5);
      expect(prisma.mealPlanFavorite.count).toHaveBeenCalledWith({
        where: { userId: testUserId },
      });
    });
  });

  describe('delete', () => {
    it('should delete a favorite', async () => {
      prisma.mealPlanFavorite.delete.mockResolvedValue({} as never);

      await repository.delete(testUserId, testMealPlanId);

      expect(prisma.mealPlanFavorite.delete).toHaveBeenCalledWith({
        where: {
          userId_mealPlanId: {
            userId: testUserId,
            mealPlanId: testMealPlanId,
          },
        },
      });
    });
  });

  describe('mealPlanExists', () => {
    it('should return true when meal plan exists', async () => {
      prisma.mealPlan.count.mockResolvedValue(1 as never);

      const result = await repository.mealPlanExists(testMealPlanId);

      expect(result).toBe(true);
      expect(prisma.mealPlan.count).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
      });
    });

    it('should return false when meal plan does not exist', async () => {
      prisma.mealPlan.count.mockResolvedValue(0 as never);

      const result = await repository.mealPlanExists(testMealPlanId);

      expect(result).toBe(false);
    });
  });
});
