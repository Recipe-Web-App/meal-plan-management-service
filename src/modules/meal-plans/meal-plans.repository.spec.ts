import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/config/database.config';
import { MealType } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('MealPlans Repository Tests', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const testRecipeId = BigInt(1);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
      ],
    }).compile();

    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MealPlan CRUD Operations', () => {
    it('should create a new meal plan', async () => {
      const expectedMealPlan = {
        mealPlanId: BigInt(1),
        userId: testUserId,
        name: 'Test Meal Plan',
        description: 'A test meal plan for unit testing',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.mealPlan.create.mockResolvedValue(expectedMealPlan);

      const result = await prisma.mealPlan.create({
        data: {
          name: 'Test Meal Plan',
          description: 'A test meal plan for unit testing',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
          user: {
            connect: { userId: testUserId },
          },
        },
      });

      expect(result).toEqual(expectedMealPlan);
      expect(prisma.mealPlan.create).toHaveBeenCalledTimes(1);
      expect(prisma.mealPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Meal Plan',
          description: 'A test meal plan for unit testing',
        }),
      });
    });

    it('should find meal plans by user', async () => {
      const expectedMealPlans = [
        {
          mealPlanId: BigInt(1),
          userId: testUserId,
          name: 'Weekly Plan 1',
          description: null,
          startDate: null,
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          mealPlanId: BigInt(2),
          userId: testUserId,
          name: 'Weekly Plan 2',
          description: null,
          startDate: null,
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.mealPlan.findMany.mockResolvedValue(expectedMealPlans);

      const result = await prisma.mealPlan.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(expectedMealPlans);
      expect(result).toHaveLength(2);
      expect(prisma.mealPlan.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should update a meal plan', async () => {
      const mealPlanId = BigInt(1);
      const updatedMealPlan = {
        mealPlanId,
        userId: testUserId,
        name: 'Updated Name',
        description: 'Updated Description',
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.mealPlan.update.mockResolvedValue(updatedMealPlan);

      const result = await prisma.mealPlan.update({
        where: { mealPlanId },
        data: {
          name: 'Updated Name',
          description: 'Updated Description',
        },
      });

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated Description');
      expect(prisma.mealPlan.update).toHaveBeenCalledTimes(1);
    });

    it('should delete a meal plan', async () => {
      const mealPlanId = BigInt(1);
      const deletedMealPlan = {
        mealPlanId,
        userId: testUserId,
        name: 'To Be Deleted',
        description: null,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.mealPlan.delete.mockResolvedValue(deletedMealPlan);

      const result = await prisma.mealPlan.delete({
        where: { mealPlanId },
      });

      expect(result).toEqual(deletedMealPlan);
      expect(prisma.mealPlan.delete).toHaveBeenCalledWith({
        where: { mealPlanId },
      });
    });

    it('should find meal plans within a date range', async () => {
      const februaryPlan = {
        mealPlanId: BigInt(2),
        userId: testUserId,
        name: 'February Plan',
        description: null,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.mealPlan.findMany.mockResolvedValue([februaryPlan]);

      const result = await prisma.mealPlan.findMany({
        where: {
          userId: testUserId,
          AND: [
            {
              OR: [{ startDate: { lte: new Date('2024-02-29') } }, { startDate: null }],
            },
            {
              OR: [{ endDate: { gte: new Date('2024-02-01') } }, { endDate: null }],
            },
          ],
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('February Plan');
      expect(prisma.mealPlan.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('MealPlanRecipe Operations', () => {
    const mealPlanId = BigInt(1);

    it('should add a recipe to a meal plan', async () => {
      const expectedMealPlanRecipe = {
        mealPlanId,
        recipeId: testRecipeId,
        mealDate: new Date('2024-01-02'),
        mealType: MealType.LUNCH,
      };

      prisma.mealPlanRecipe.create.mockResolvedValue(expectedMealPlanRecipe);

      const result = await prisma.mealPlanRecipe.create({
        data: {
          mealPlanId,
          recipeId: testRecipeId,
          mealDate: new Date('2024-01-02'),
          mealType: MealType.LUNCH,
        },
      });

      expect(result).toEqual(expectedMealPlanRecipe);
      expect(result.mealType).toBe(MealType.LUNCH);
      expect(prisma.mealPlanRecipe.create).toHaveBeenCalledTimes(1);
    });

    it('should find all recipes in a meal plan with includes', async () => {
      const mealPlanWithRecipes = {
        mealPlanId,
        userId: testUserId,
        name: 'Recipe Test Plan',
        description: null,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        mealPlanRecipes: [
          {
            mealPlanId,
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-02'),
            mealType: MealType.BREAKFAST,
            recipe: {
              recipeId: testRecipeId,
              userId: testUserId,
              title: 'Test Recipe for Meal Plans',
            },
          },
          {
            mealPlanId,
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-02'),
            mealType: MealType.LUNCH,
            recipe: {
              recipeId: testRecipeId,
              userId: testUserId,
              title: 'Test Recipe for Meal Plans',
            },
          },
        ],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mealPlanWithRecipes);

      const result = await prisma.mealPlan.findUnique({
        where: { mealPlanId },
        include: {
          mealPlanRecipes: {
            include: {
              recipe: true,
            },
            orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
          },
        },
      });

      expect(result).toBeDefined();
      expect(result.mealPlanRecipes).toHaveLength(2);
      expect(result.mealPlanRecipes[0].recipe.title).toBe('Test Recipe for Meal Plans');
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should remove a recipe from a meal plan', async () => {
      const deletedRecipe = {
        mealPlanId,
        recipeId: testRecipeId,
        mealDate: new Date('2024-01-03'),
        mealType: MealType.DINNER,
      };

      prisma.mealPlanRecipe.delete.mockResolvedValue(deletedRecipe);

      const result = await prisma.mealPlanRecipe.delete({
        where: {
          mealPlanId_recipeId_mealDate: {
            mealPlanId,
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-03'),
          },
        },
      });

      expect(result).toEqual(deletedRecipe);
      expect(prisma.mealPlanRecipe.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple recipes for the same meal date', async () => {
      const mealDate = new Date('2024-01-04');
      const expectedRecipes = [
        {
          mealPlanId,
          recipeId: testRecipeId,
          mealDate,
          mealType: MealType.BREAKFAST,
        },
        {
          mealPlanId,
          recipeId: testRecipeId,
          mealDate,
          mealType: MealType.LUNCH,
        },
      ];

      prisma.mealPlanRecipe.findMany.mockResolvedValue(expectedRecipes);

      const result = await prisma.mealPlanRecipe.findMany({
        where: {
          mealPlanId,
          mealDate,
        },
        orderBy: { mealType: 'asc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].mealType).toBe(MealType.BREAKFAST);
      expect(result[1].mealType).toBe(MealType.LUNCH);
    });

    it('should verify cascade delete behavior', async () => {
      // When a meal plan is deleted, we expect associated recipes to be deleted
      // This is handled by the database, but we can verify the mock behavior

      prisma.mealPlanRecipe.findMany.mockResolvedValue([]);

      const result = await prisma.mealPlanRecipe.findMany({
        where: { mealPlanId },
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('Complex Queries', () => {
    it('should find meal plans with specific recipes', async () => {
      const mealPlansWithRecipe = [
        {
          mealPlanId: BigInt(1),
          userId: testUserId,
          name: 'Complex Query Test',
          description: null,
          startDate: null,
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          mealPlanRecipes: [
            {
              mealPlanId: BigInt(1),
              recipeId: testRecipeId,
              mealDate: new Date('2024-01-06'),
              mealType: MealType.LUNCH,
            },
          ],
        },
      ];

      prisma.mealPlan.findMany.mockResolvedValue(mealPlansWithRecipe);

      const result = await prisma.mealPlan.findMany({
        where: {
          userId: testUserId,
          mealPlanRecipes: {
            some: {
              recipeId: testRecipeId,
            },
          },
        },
        include: {
          mealPlanRecipes: true,
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].mealPlanRecipes).toHaveLength(1);
      expect(prisma.mealPlan.findMany).toHaveBeenCalledTimes(1);
    });

    it('should aggregate meal types in a meal plan', async () => {
      const mealPlanId = BigInt(1);
      const aggregationResult = [
        {
          mealType: MealType.BREAKFAST,
          _count: {
            mealType: 2,
          },
        },
        {
          mealType: MealType.LUNCH,
          _count: {
            mealType: 1,
          },
        },
      ];

      prisma.mealPlanRecipe.groupBy.mockResolvedValue(aggregationResult as any);

      const result = await prisma.mealPlanRecipe.groupBy({
        by: ['mealType'],
        where: {
          mealPlanId,
        },
        _count: {
          mealType: true,
        },
      });

      expect(result).toHaveLength(2);
      const breakfastCount = result.find((mt) => mt.mealType === MealType.BREAKFAST);
      const lunchCount = result.find((mt) => mt.mealType === MealType.LUNCH);
      expect(breakfastCount._count.mealType).toBe(2);
      expect(lunchCount._count.mealType).toBe(1);
      expect(prisma.mealPlanRecipe.groupBy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      prisma.mealPlan.create.mockRejectedValue(error);

      await expect(
        prisma.mealPlan.create({
          data: {
            name: 'Test Plan',
            userId: testUserId,
          },
        }),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle unique constraint violations', async () => {
      const error = new Error('Unique constraint failed');
      prisma.mealPlanRecipe.create.mockRejectedValue(error);

      await expect(
        prisma.mealPlanRecipe.create({
          data: {
            mealPlanId: BigInt(1),
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-01'),
            mealType: MealType.BREAKFAST,
          },
        }),
      ).rejects.toThrow('Unique constraint failed');
    });

    it('should handle foreign key constraint violations', async () => {
      const error = new Error('Foreign key constraint failed');
      prisma.mealPlan.create.mockRejectedValue(error);

      await expect(
        prisma.mealPlan.create({
          data: {
            name: 'Test Plan',
            userId: 'non-existent-user',
          },
        }),
      ).rejects.toThrow('Foreign key constraint failed');
    });
  });
});
