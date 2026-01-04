import { describe, it, expect, beforeEach, afterEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/config/database.config';
import { MealType } from '@generated/prisma/client';
import { MealPlansRepository } from './meal-plans.repository';

describe('MealPlansRepository', () => {
  let repository: MealPlansRepository;
  let prisma: {
    mealPlan: {
      create: Mock<(...args: unknown[]) => unknown>;
      findUnique: Mock<(...args: unknown[]) => unknown>;
      findMany: Mock<(...args: unknown[]) => unknown>;
      update: Mock<(...args: unknown[]) => unknown>;
      delete: Mock<(...args: unknown[]) => unknown>;
      count: Mock<(...args: unknown[]) => unknown>;
    };
    mealPlanRecipe: {
      create: Mock<(...args: unknown[]) => unknown>;
      delete: Mock<(...args: unknown[]) => unknown>;
      count: Mock<(...args: unknown[]) => unknown>;
      groupBy: Mock<(...args: unknown[]) => unknown>;
      findMany: Mock<(...args: unknown[]) => unknown>;
    };
  };

  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const testMealPlanId = BigInt(1);
  const testRecipeId = BigInt(100);

  const mockPrismaService = {
    mealPlan: {
      create: mock(() => {}),
      findUnique: mock(() => {}),
      findMany: mock(() => {}),
      update: mock(() => {}),
      delete: mock(() => {}),
      count: mock(() => {}),
    },
    mealPlanRecipe: {
      create: mock(() => {}),
      delete: mock(() => {}),
      count: mock(() => {}),
      groupBy: mock(() => {}),
      findMany: mock(() => {}),
    },
  };

  beforeEach(async () => {
    // Reset all mocks
    mockPrismaService.mealPlan.create.mockReset();
    mockPrismaService.mealPlan.findUnique.mockReset();
    mockPrismaService.mealPlan.findMany.mockReset();
    mockPrismaService.mealPlan.update.mockReset();
    mockPrismaService.mealPlan.delete.mockReset();
    mockPrismaService.mealPlan.count.mockReset();
    mockPrismaService.mealPlanRecipe.create.mockReset();
    mockPrismaService.mealPlanRecipe.delete.mockReset();
    mockPrismaService.mealPlanRecipe.count.mockReset();
    mockPrismaService.mealPlanRecipe.groupBy.mockReset();
    mockPrismaService.mealPlanRecipe.findMany.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlansRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<MealPlansRepository>(MealPlansRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    // Mocks are reset in beforeEach
  });

  describe('create', () => {
    it('should create a meal plan', async () => {
      const createData = {
        userId: testUserId,
        name: 'Test Meal Plan',
        description: 'Test Description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      };

      const expectedMealPlan = {
        mealPlanId: testMealPlanId,
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isArchived: false,
      };

      prisma.mealPlan.create.mockResolvedValue(expectedMealPlan as any);

      const result = await repository.create(createData);

      expect(result).toEqual(expectedMealPlan);
      expect(prisma.mealPlan.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          description: createData.description,
          startDate: createData.startDate,
          endDate: createData.endDate,
          user: {
            connect: { userId: createData.userId },
          },
        },
      });
    });
  });

  describe('findById', () => {
    it('should return meal plan by id', async () => {
      const mockMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Plan',
        description: null,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isArchived: false,
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mockMealPlan as any);

      const result = await repository.findById(testMealPlanId);

      expect(result).toEqual(mockMealPlan);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
      });
    });

    it('should return null when meal plan not found', async () => {
      prisma.mealPlan.findUnique.mockResolvedValue(null);

      const result = await repository.findById(testMealPlanId);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithRecipes', () => {
    it('should return meal plan with recipes', async () => {
      const mockMealPlanWithRecipes = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Plan',
        description: null,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isArchived: false,
        mealPlanRecipes: [
          {
            mealPlanRecipeId: BigInt(1),
            mealPlanId: testMealPlanId,
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-01'),
            mealType: MealType.BREAKFAST,
            servings: 2,
            recipe: {
              recipeId: testRecipeId,
              title: 'Test Recipe',
              userId: testUserId,
            },
          },
        ],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mockMealPlanWithRecipes as any);

      const result = await repository.findByIdWithRecipes(testMealPlanId);

      expect(result).toEqual(mockMealPlanWithRecipes);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        include: {
          mealPlanRecipes: {
            include: {
              recipe: {
                select: {
                  recipeId: true,
                  title: true,
                  userId: true,
                },
              },
            },
            orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
          },
        },
      });
    });
  });

  describe('findByUser', () => {
    it('should return meal plans for user', async () => {
      const mockMealPlans = [
        {
          mealPlanId: testMealPlanId,
          userId: testUserId,
          name: 'Plan 1',
          description: null,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isArchived: false,
        },
      ];

      prisma.mealPlan.findMany.mockResolvedValue(mockMealPlans as any);

      const result = await repository.findByUser(testUserId);

      expect(result).toEqual(mockMealPlans);
      expect(prisma.mealPlan.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update meal plan', async () => {
      const updateData = {
        name: 'Updated Plan',
        description: 'Updated Description',
      };

      const updatedMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        ...updateData,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isArchived: false,
      };

      prisma.mealPlan.update.mockResolvedValue(updatedMealPlan as any);

      const result = await repository.update(testMealPlanId, updateData);

      expect(result).toEqual(updatedMealPlan);
      expect(prisma.mealPlan.update).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete meal plan', async () => {
      const deletedMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Deleted Plan',
        description: null,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isArchived: false,
      };

      prisma.mealPlan.delete.mockResolvedValue(deletedMealPlan as any);

      const result = await repository.delete(testMealPlanId);

      expect(result).toEqual(deletedMealPlan);
      expect(prisma.mealPlan.delete).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
      });
    });
  });

  describe('addRecipeToMealPlan', () => {
    it('should add recipe to meal plan', async () => {
      const addData = {
        mealPlanId: testMealPlanId,
        recipeId: testRecipeId,
        mealDate: new Date('2024-01-01'),
        mealType: MealType.BREAKFAST,
      };

      const expectedRecipe = {
        mealPlanRecipeId: BigInt(1),
        ...addData,
        servings: null,
      };

      prisma.mealPlanRecipe.create.mockResolvedValue(expectedRecipe as any);

      const result = await repository.addRecipeToMealPlan(addData);

      expect(result).toEqual(expectedRecipe);
      expect(prisma.mealPlanRecipe.create).toHaveBeenCalledWith({
        data: {
          mealPlanId: addData.mealPlanId,
          recipeId: addData.recipeId,
          mealDate: addData.mealDate,
          mealType: addData.mealType,
        },
      });
    });
  });

  describe('removeRecipeFromMealPlan', () => {
    it('should remove recipe from meal plan', async () => {
      const removeData = {
        mealPlanId: testMealPlanId,
        recipeId: testRecipeId,
        mealDate: new Date('2024-01-01'),
        mealType: MealType.BREAKFAST,
      };

      const deletedRecipe = {
        mealPlanRecipeId: BigInt(1),
        ...removeData,
        servings: 2,
      };

      prisma.mealPlanRecipe.delete.mockResolvedValue(deletedRecipe as any);

      const result = await repository.removeRecipeFromMealPlan(
        removeData.mealPlanId,
        removeData.recipeId,
        removeData.mealDate,
      );

      expect(result).toEqual(deletedRecipe);
      expect(prisma.mealPlanRecipe.delete).toHaveBeenCalledWith({
        where: {
          mealPlanId_recipeId_mealDate: {
            mealPlanId: removeData.mealPlanId,
            recipeId: removeData.recipeId,
            mealDate: removeData.mealDate,
          },
        },
      });
    });
  });

  describe('existsByIdAndUser', () => {
    it('should return true when meal plan exists for user', async () => {
      prisma.mealPlan.count.mockResolvedValue(1);

      const result = await repository.existsByIdAndUser(testMealPlanId, testUserId);

      expect(result).toBe(true);
      expect(prisma.mealPlan.count).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          userId: testUserId,
        },
      });
    });

    it('should return false when meal plan does not exist for user', async () => {
      prisma.mealPlan.count.mockResolvedValue(0);

      const result = await repository.existsByIdAndUser(testMealPlanId, testUserId);

      expect(result).toBe(false);
    });
  });

  describe('findManyWithFilters', () => {
    it('should find meal plans with filters', async () => {
      const filters = {
        userId: testUserId,
        isActive: true,
        includeRecipes: true,
      };

      const sorting = {
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      const pagination = {
        skip: 0,
        take: 20,
      };

      const mockMealPlans = [
        {
          mealPlanId: testMealPlanId,
          userId: testUserId,
          name: 'Filtered Plan',
          description: null,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isArchived: false,
        },
      ];

      prisma.mealPlan.findMany.mockResolvedValue(mockMealPlans as any);

      const result = await repository.findManyWithFilters(filters, sorting, pagination);

      expect(result).toEqual(mockMealPlans);
      expect(prisma.mealPlan.findMany).toHaveBeenCalled();
    });
  });

  describe('countMealPlans', () => {
    it('should count meal plans with filters', async () => {
      const filters = {
        userId: testUserId,
        isActive: true,
      };

      prisma.mealPlan.count.mockResolvedValue(5);

      const result = await repository.countMealPlans(filters);

      expect(result).toBe(5);
      expect(prisma.mealPlan.count).toHaveBeenCalled();
    });
  });

  describe('getMealPlanStatistics', () => {
    it('should get meal plan statistics', async () => {
      const mockStats = {
        totalRecipes: 10,
        mealTypeCounts: [
          { mealType: MealType.BREAKFAST, count: 5 },
          { mealType: MealType.LUNCH, count: 3 },
          { mealType: MealType.DINNER, count: 2 },
        ],
        uniqueDates: [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')],
      };

      prisma.mealPlanRecipe.count.mockResolvedValue(mockStats.totalRecipes);
      prisma.mealPlanRecipe.groupBy.mockResolvedValue(
        mockStats.mealTypeCounts.map((item) => ({
          mealType: item.mealType,
          _count: { mealType: item.count },
        })) as any,
      );
      prisma.mealPlanRecipe.findMany.mockResolvedValue(
        mockStats.uniqueDates.map((date) => ({ mealDate: date })) as any,
      );

      const result = await repository.getMealPlanStatistics(testMealPlanId);

      expect(result).toEqual({
        totalRecipes: mockStats.totalRecipes,
        daysWithMeals: mockStats.uniqueDates.length,
        mealTypeCounts: mockStats.mealTypeCounts,
        uniqueDates: mockStats.uniqueDates,
      });
    });
  });

  describe('verifyMealPlanOwnership', () => {
    it('should return true when user owns meal plan', async () => {
      prisma.mealPlan.count.mockResolvedValue(1);

      const result = await repository.verifyMealPlanOwnership(testMealPlanId, testUserId);

      expect(result).toBe(true);
      expect(prisma.mealPlan.count).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          userId: testUserId,
        },
      });
    });

    it('should return false when user does not own meal plan', async () => {
      prisma.mealPlan.count.mockResolvedValue(0);

      const result = await repository.verifyMealPlanOwnership(testMealPlanId, testUserId);

      expect(result).toBe(false);
    });

    it('should return false when meal plan not found', async () => {
      prisma.mealPlan.count.mockResolvedValue(0);

      const result = await repository.verifyMealPlanOwnership(testMealPlanId, testUserId);

      expect(result).toBe(false);
    });
  });

  describe('checkMealPlanExists', () => {
    it('should return true when meal plan exists', async () => {
      prisma.mealPlan.count.mockResolvedValue(1);

      const result = await repository.checkMealPlanExists(testMealPlanId);

      expect(result).toBe(true);
      expect(prisma.mealPlan.count).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
      });
    });

    it('should return false when meal plan does not exist', async () => {
      prisma.mealPlan.count.mockResolvedValue(0);

      const result = await repository.checkMealPlanExists(testMealPlanId);

      expect(result).toBe(false);
    });
  });

  describe('findRecipesForDateRange', () => {
    it('should find recipes for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const mockRecipes = [
        {
          mealPlanRecipeId: BigInt(1),
          mealPlanId: testMealPlanId,
          recipeId: testRecipeId,
          mealDate: new Date('2024-01-01'),
          mealType: MealType.BREAKFAST,
          servings: 2,
        },
      ];

      prisma.mealPlanRecipe.findMany.mockResolvedValue(mockRecipes as any);

      const result = await repository.findRecipesForDateRange(
        testMealPlanId,
        startDate,
        endDate,
        {},
      );

      expect(result).toEqual(mockRecipes);
      expect(prisma.mealPlanRecipe.findMany).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          mealDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          recipe: {
            select: expect.any(Object),
          },
        },
        orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
      });
    });

    it('should find recipes for date range with meal type filter', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      const filters = { mealType: MealType.BREAKFAST };

      const mockRecipes = [
        {
          mealPlanRecipeId: BigInt(1),
          mealPlanId: testMealPlanId,
          recipeId: testRecipeId,
          mealDate: new Date('2024-01-01'),
          mealType: MealType.BREAKFAST,
          servings: 2,
        },
      ];

      prisma.mealPlanRecipe.findMany.mockResolvedValue(mockRecipes as any);

      const result = await repository.findRecipesForDateRange(
        testMealPlanId,
        startDate,
        endDate,
        filters,
      );

      expect(result).toEqual(mockRecipes);
      expect(prisma.mealPlanRecipe.findMany).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          mealDate: {
            gte: startDate,
            lte: endDate,
          },
          mealType: MealType.BREAKFAST,
        },
        include: {
          recipe: {
            select: expect.any(Object),
          },
        },
        orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
      });
    });
  });

  describe('findRecipesForWeek', () => {
    it('should find recipes for week', async () => {
      const startDate = new Date('2024-01-01');
      const filters = { mealType: MealType.LUNCH };

      const mockRecipes = [
        {
          mealPlanRecipeId: BigInt(1),
          mealPlanId: testMealPlanId,
          recipeId: testRecipeId,
          mealDate: new Date('2024-01-02'),
          mealType: MealType.LUNCH,
          servings: 2,
        },
      ];

      prisma.mealPlanRecipe.findMany.mockResolvedValue(mockRecipes as any);

      const result = await repository.findRecipesForWeek(testMealPlanId, startDate, filters);

      expect(result).toEqual(mockRecipes);
      expect(prisma.mealPlanRecipe.findMany).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          mealDate: {
            gte: startDate,
            lte: expect.any(Date), // Should be startDate + 6 days, end of day
          },
          mealType: MealType.LUNCH,
        },
        include: {
          recipe: {
            select: expect.any(Object),
          },
        },
        orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
      });
    });
  });

  describe('findRecipesForMonth', () => {
    it('should find recipes for month', async () => {
      const year = 2024;
      const month = 1;
      const filters = {};

      const mockRecipes = [
        {
          mealPlanRecipeId: BigInt(1),
          mealPlanId: testMealPlanId,
          recipeId: testRecipeId,
          mealDate: new Date('2024-01-15'),
          mealType: MealType.DINNER,
          servings: 4,
        },
      ];

      prisma.mealPlanRecipe.findMany.mockResolvedValue(mockRecipes as any);

      const result = await repository.findRecipesForMonth(testMealPlanId, year, month, filters);

      expect(result).toEqual(mockRecipes);
      expect(prisma.mealPlanRecipe.findMany).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          mealDate: {
            gte: new Date(year, month - 1, 1),
            lte: expect.any(Date), // Should be end of month
          },
        },
        include: {
          recipe: {
            select: expect.any(Object),
          },
        },
        orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
      });
    });
  });

  describe('error scenarios', () => {
    it('should handle database errors in create', async () => {
      const createData = {
        userId: testUserId,
        name: 'Test Plan',
      };

      const dbError = new Error('Database connection failed');
      prisma.mealPlan.create.mockRejectedValue(dbError);

      await expect(repository.create(createData)).rejects.toThrow('Database connection failed');
    });

    it('should handle constraint violations in addRecipeToMealPlan', async () => {
      const addData = {
        mealPlanId: testMealPlanId,
        recipeId: testRecipeId,
        mealDate: new Date('2024-01-01'),
        mealType: MealType.BREAKFAST,
        servings: 2,
      };

      const constraintError = new Error('Unique constraint violation');
      prisma.mealPlanRecipe.create.mockRejectedValue(constraintError);

      await expect(repository.addRecipeToMealPlan(addData)).rejects.toThrow(
        'Unique constraint violation',
      );
    });
  });

  describe('additional branch coverage tests', () => {
    it('should handle findByIdWithRecipesFiltered with no filters', async () => {
      const mockMealPlanWithRecipes = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Plan',
        description: null,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isArchived: false,
        mealPlanRecipes: [],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mockMealPlanWithRecipes as any);

      const result = await repository.findByIdWithRecipesFiltered(testMealPlanId, undefined);

      expect(result).toEqual(mockMealPlanWithRecipes);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        include: {
          mealPlanRecipes: {
            where: {},
            include: {
              recipe: {
                select: {
                  recipeId: true,
                  title: true,
                  userId: true,
                },
              },
            },
            orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
          },
        },
      });
    });

    it('should handle findByIdWithRecipesFiltered with meal type filter only', async () => {
      const filters = { mealType: MealType.BREAKFAST };
      const mockMealPlanWithRecipes = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Plan',
        mealPlanRecipes: [],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mockMealPlanWithRecipes as any);

      const result = await repository.findByIdWithRecipesFiltered(testMealPlanId, filters);

      expect(result).toEqual(mockMealPlanWithRecipes);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        include: {
          mealPlanRecipes: {
            where: { mealType: MealType.BREAKFAST },
            include: {
              recipe: {
                select: {
                  recipeId: true,
                  title: true,
                  userId: true,
                },
              },
            },
            orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
          },
        },
      });
    });

    it('should handle findByIdWithRecipesFiltered with date range filter only', async () => {
      const filters = {
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
        },
      };

      const mockMealPlanWithRecipes = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Plan',
        mealPlanRecipes: [],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mockMealPlanWithRecipes as any);

      const result = await repository.findByIdWithRecipesFiltered(testMealPlanId, filters);

      expect(result).toEqual(mockMealPlanWithRecipes);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        include: {
          mealPlanRecipes: {
            where: {
              mealDate: {
                gte: new Date('2024-01-01'),
                lte: new Date('2024-01-07'),
              },
            },
            include: {
              recipe: {
                select: {
                  recipeId: true,
                  title: true,
                  userId: true,
                },
              },
            },
            orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
          },
        },
      });
    });

    it('should handle findByIdWithRecipesFiltered with both meal type and date range filters', async () => {
      const filters = {
        mealType: MealType.DINNER,
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
        },
      };

      const mockMealPlanWithRecipes = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Plan',
        mealPlanRecipes: [],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mockMealPlanWithRecipes as any);

      const result = await repository.findByIdWithRecipesFiltered(testMealPlanId, filters);

      expect(result).toEqual(mockMealPlanWithRecipes);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        include: {
          mealPlanRecipes: {
            where: {
              mealType: MealType.DINNER,
              mealDate: {
                gte: new Date('2024-01-01'),
                lte: new Date('2024-01-07'),
              },
            },
            include: {
              recipe: {
                select: {
                  recipeId: true,
                  title: true,
                  userId: true,
                },
              },
            },
            orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
          },
        },
      });
    });

    it('should handle date range filter with only start date', async () => {
      const filters = {
        dateRange: {
          startDate: new Date('2024-01-01'),
        },
      };

      const mockMealPlanWithRecipes = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Plan',
        mealPlanRecipes: [],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mockMealPlanWithRecipes as any);

      const result = await repository.findByIdWithRecipesFiltered(testMealPlanId, filters);

      expect(result).toEqual(mockMealPlanWithRecipes);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        include: {
          mealPlanRecipes: {
            where: {
              mealDate: {
                gte: new Date('2024-01-01'),
              },
            },
            include: {
              recipe: {
                select: {
                  recipeId: true,
                  title: true,
                  userId: true,
                },
              },
            },
            orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
          },
        },
      });
    });

    it('should handle date range filter with only end date', async () => {
      const filters = {
        dateRange: {
          endDate: new Date('2024-01-07'),
        },
      };

      const mockMealPlanWithRecipes = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Plan',
        mealPlanRecipes: [],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mockMealPlanWithRecipes as any);

      const result = await repository.findByIdWithRecipesFiltered(testMealPlanId, filters);

      expect(result).toEqual(mockMealPlanWithRecipes);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        include: {
          mealPlanRecipes: {
            where: {
              mealDate: {
                lte: new Date('2024-01-07'),
              },
            },
            include: {
              recipe: {
                select: {
                  recipeId: true,
                  title: true,
                  userId: true,
                },
              },
            },
            orderBy: [{ mealDate: 'asc' }, { mealType: 'asc' }],
          },
        },
      });
    });

    it('should handle empty date range object', async () => {
      const filters = { dateRange: {} };

      const mockMealPlanWithRecipes = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Plan',
        mealPlanRecipes: [],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(mockMealPlanWithRecipes as any);

      const result = await repository.findByIdWithRecipesFiltered(testMealPlanId, filters);

      expect(result).toEqual(mockMealPlanWithRecipes);
    });

    it('should handle return null when meal plan not found', async () => {
      prisma.mealPlan.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithRecipesFiltered(testMealPlanId, undefined);

      expect(result).toBeNull();
    });
  });
});
