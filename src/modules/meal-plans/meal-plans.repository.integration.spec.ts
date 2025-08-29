import { Test, TestingModule } from '@nestjs/testing';
import { MealPlansRepository } from './meal-plans.repository';
import { PrismaService } from '@/config/database.config';
import { MealType } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('MealPlansRepository', () => {
  let repository: MealPlansRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const testRecipeId = BigInt(1);
  const testMealPlanId = BigInt(1);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlansRepository,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
      ],
    }).compile();

    repository = module.get<MealPlansRepository>(MealPlansRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new meal plan', async () => {
      const createData = {
        userId: testUserId,
        name: 'Test Meal Plan',
        description: 'A test meal plan',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      };

      const expectedMealPlan = {
        mealPlanId: testMealPlanId,
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.mealPlan.create.mockResolvedValue(expectedMealPlan);

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
    it('should find a meal plan by id', async () => {
      const expectedMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Meal Plan',
        description: null,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.mealPlan.findUnique.mockResolvedValue(expectedMealPlan);

      const result = await repository.findById(testMealPlanId);

      expect(result).toEqual(expectedMealPlan);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
      });
    });

    it('should return null when meal plan not found', async () => {
      prisma.mealPlan.findUnique.mockResolvedValue(null);

      const result = await repository.findById(BigInt(999));

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithRecipes', () => {
    it('should find a meal plan with recipes included', async () => {
      const expectedResult = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Test Meal Plan',
        description: null,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        mealPlanRecipes: [
          {
            mealPlanId: testMealPlanId,
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-02'),
            mealType: MealType.BREAKFAST,
            recipe: {
              recipeId: testRecipeId,
              title: 'Test Recipe',
              userId: testUserId,
            },
          },
        ],
      };

      prisma.mealPlan.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.findByIdWithRecipes(testMealPlanId);

      expect(result).toEqual(expectedResult);
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
    it('should find all meal plans for a user', async () => {
      const expectedMealPlans = [
        {
          mealPlanId: BigInt(1),
          userId: testUserId,
          name: 'Meal Plan 1',
          description: null,
          startDate: null,
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          mealPlanId: BigInt(2),
          userId: testUserId,
          name: 'Meal Plan 2',
          description: null,
          startDate: null,
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.mealPlan.findMany.mockResolvedValue(expectedMealPlans);

      const result = await repository.findByUser(testUserId);

      expect(result).toEqual(expectedMealPlans);
      expect(prisma.mealPlan.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByFilters', () => {
    it('should find meal plans within date range', async () => {
      const filters = {
        userId: testUserId,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-28'),
      };

      const expectedMealPlans = [
        {
          mealPlanId: testMealPlanId,
          userId: testUserId,
          name: 'February Plan',
          description: null,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-28'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.mealPlan.findMany.mockResolvedValue(expectedMealPlans);

      const result = await repository.findByFilters(filters);

      expect(result).toEqual(expectedMealPlans);
      expect(prisma.mealPlan.findMany).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          AND: [
            {
              OR: [{ startDate: { lte: filters.endDate } }, { startDate: null }],
            },
            {
              OR: [{ endDate: { gte: filters.startDate } }, { endDate: null }],
            },
          ],
        },
        orderBy: { startDate: 'asc' },
      });
    });
  });

  describe('update', () => {
    it('should update a meal plan', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      const expectedMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        ...updateData,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.mealPlan.update.mockResolvedValue(expectedMealPlan);

      const result = await repository.update(testMealPlanId, updateData);

      expect(result).toEqual(expectedMealPlan);
      expect(prisma.mealPlan.update).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete a meal plan', async () => {
      const expectedMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'To Be Deleted',
        description: null,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.mealPlan.delete.mockResolvedValue(expectedMealPlan);

      const result = await repository.delete(testMealPlanId);

      expect(result).toEqual(expectedMealPlan);
      expect(prisma.mealPlan.delete).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
      });
    });
  });

  describe('Recipe operations', () => {
    it('should add a recipe to a meal plan', async () => {
      const addRecipeData = {
        mealPlanId: testMealPlanId,
        recipeId: testRecipeId,
        mealDate: new Date('2024-01-02'),
        mealType: MealType.LUNCH,
      };

      const expectedResult = { ...addRecipeData };

      prisma.mealPlanRecipe.create.mockResolvedValue(expectedResult);

      const result = await repository.addRecipeToMealPlan(addRecipeData);

      expect(result).toEqual(expectedResult);
      expect(prisma.mealPlanRecipe.create).toHaveBeenCalledWith({
        data: addRecipeData,
      });
    });

    it('should remove a recipe from a meal plan', async () => {
      const mealDate = new Date('2024-01-02');
      const expectedResult = {
        mealPlanId: testMealPlanId,
        recipeId: testRecipeId,
        mealDate,
        mealType: MealType.DINNER,
      };

      prisma.mealPlanRecipe.delete.mockResolvedValue(expectedResult);

      const result = await repository.removeRecipeFromMealPlan(
        testMealPlanId,
        testRecipeId,
        mealDate,
      );

      expect(result).toEqual(expectedResult);
      expect(prisma.mealPlanRecipe.delete).toHaveBeenCalledWith({
        where: {
          mealPlanId_recipeId_mealDate: {
            mealPlanId: testMealPlanId,
            recipeId: testRecipeId,
            mealDate,
          },
        },
      });
    });

    it('should find all recipes for a meal plan', async () => {
      const expectedRecipes = [
        {
          mealPlanId: testMealPlanId,
          recipeId: testRecipeId,
          mealDate: new Date('2024-01-02'),
          mealType: MealType.BREAKFAST,
          recipe: {
            recipeId: testRecipeId,
            title: 'Test Recipe',
            userId: testUserId,
          },
        },
      ];

      prisma.mealPlanRecipe.findMany.mockResolvedValue(expectedRecipes);

      const result = await repository.findRecipesForMealPlan(testMealPlanId);

      expect(result).toEqual(expectedRecipes);
    });

    it('should find recipes for a specific date', async () => {
      const mealDate = new Date('2024-01-02');
      const expectedRecipes = [
        {
          mealPlanId: testMealPlanId,
          recipeId: testRecipeId,
          mealDate,
          mealType: MealType.BREAKFAST,
          recipe: {
            recipeId: testRecipeId,
            title: 'Breakfast Recipe',
            userId: testUserId,
          },
        },
        {
          mealPlanId: testMealPlanId,
          recipeId: BigInt(2),
          mealDate,
          mealType: MealType.LUNCH,
          recipe: {
            recipeId: BigInt(2),
            title: 'Lunch Recipe',
            userId: testUserId,
          },
        },
      ];

      prisma.mealPlanRecipe.findMany.mockResolvedValue(expectedRecipes);

      const result = await repository.findRecipesForDate(testMealPlanId, mealDate);

      expect(result).toEqual(expectedRecipes);
      expect(prisma.mealPlanRecipe.findMany).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          mealDate,
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
        orderBy: { mealType: 'asc' },
      });
    });
  });

  describe('Aggregation and existence checks', () => {
    it('should count meals by type', async () => {
      const expectedResult = [
        {
          mealType: MealType.BREAKFAST,
          _count: { mealType: 2 },
        },
        {
          mealType: MealType.LUNCH,
          _count: { mealType: 3 },
        },
      ];

      prisma.mealPlanRecipe.groupBy.mockResolvedValue(expectedResult as any);

      const result = await repository.countMealsByType(testMealPlanId);

      expect(result).toEqual(expectedResult);
      expect(prisma.mealPlanRecipe.groupBy).toHaveBeenCalledWith({
        by: ['mealType'],
        where: { mealPlanId: testMealPlanId },
        _count: { mealType: true },
      });
    });

    it('should check if meal plan exists for user', async () => {
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

    it('should check if recipe exists in meal plan', async () => {
      const mealDate = new Date('2024-01-02');

      prisma.mealPlanRecipe.count.mockResolvedValue(0);

      const result = await repository.recipeExistsInMealPlan(
        testMealPlanId,
        testRecipeId,
        mealDate,
      );

      expect(result).toBe(false);
      expect(prisma.mealPlanRecipe.count).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          recipeId: testRecipeId,
          mealDate,
        },
      });
    });
  });
});
