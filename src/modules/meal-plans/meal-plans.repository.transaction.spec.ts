import { Test, TestingModule } from '@nestjs/testing';
import { MealPlansRepository } from './meal-plans.repository';
import { PrismaService } from '@/config/database.config';
import { MealType } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('MealPlansRepository - Transaction Methods', () => {
  let repository: MealPlansRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  let mockTx: DeepMockProxy<PrismaClient>;

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
    mockTx = mockDeep<PrismaClient>();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWithRecipes', () => {
    it('should create a meal plan with recipes in a transaction', async () => {
      const createData = {
        userId: testUserId,
        name: 'Weekly Plan',
        description: 'Plan with recipes',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        recipes: [
          {
            mealPlanId: testMealPlanId, // This will be overridden
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-02'),
            mealType: MealType.BREAKFAST,
          },
          {
            mealPlanId: testMealPlanId, // This will be overridden
            recipeId: BigInt(2),
            mealDate: new Date('2024-01-02'),
            mealType: MealType.LUNCH,
          },
        ],
      };

      const createdMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: createData.name,
        description: createData.description,
        startDate: createData.startDate,
        endDate: createData.endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult = {
        ...createdMealPlan,
        mealPlanRecipes: [
          {
            mealPlanId: testMealPlanId,
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-02'),
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
            mealDate: new Date('2024-01-02'),
            mealType: MealType.LUNCH,
            recipe: {
              recipeId: BigInt(2),
              title: 'Lunch Recipe',
              userId: testUserId,
            },
          },
        ],
      };

      // Mock meal plan creation
      mockTx.mealPlan.create.mockResolvedValue(createdMealPlan);

      // Mock recipe creation
      mockTx.mealPlanRecipe.createMany.mockResolvedValue({ count: 2 });

      // Mock final query with recipes
      mockTx.mealPlan.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.createWithRecipes(createData, mockTx);

      expect(result).toEqual(expectedResult);
      expect(mockTx.mealPlan.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          description: createData.description,
          startDate: createData.startDate,
          endDate: createData.endDate,
          user: {
            connect: { userId: testUserId },
          },
        },
      });
      expect(mockTx.mealPlanRecipe.createMany).toHaveBeenCalledWith({
        data: [
          {
            mealPlanId: testMealPlanId,
            recipeId: testRecipeId,
            mealDate: createData.recipes[0].mealDate,
            mealType: createData.recipes[0].mealType,
          },
          {
            mealPlanId: testMealPlanId,
            recipeId: BigInt(2),
            mealDate: createData.recipes[1].mealDate,
            mealType: createData.recipes[1].mealType,
          },
        ],
      });
    });

    it('should create meal plan without recipes when none provided', async () => {
      const createData = {
        userId: testUserId,
        name: 'Empty Plan',
        description: 'Plan without recipes',
      };

      const createdMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: createData.name,
        description: createData.description,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult = {
        ...createdMealPlan,
        mealPlanRecipes: [],
      };

      mockTx.mealPlan.create.mockResolvedValue(createdMealPlan);
      mockTx.mealPlan.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.createWithRecipes(createData, mockTx);

      expect(result).toEqual(expectedResult);
      expect(mockTx.mealPlanRecipe.createMany).not.toHaveBeenCalled();
    });

    it('should use default prisma client when no transaction provided', async () => {
      const createData = {
        userId: testUserId,
        name: 'Default Client Plan',
      };

      const createdMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: createData.name,
        description: null,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult = {
        ...createdMealPlan,
        mealPlanRecipes: [],
      };

      prisma.mealPlan.create.mockResolvedValue(createdMealPlan);
      prisma.mealPlan.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.createWithRecipes(createData);

      expect(result).toEqual(expectedResult);
      expect(prisma.mealPlan.create).toHaveBeenCalled();
    });
  });

  describe('addMultipleRecipes', () => {
    it('should add multiple recipes to a meal plan', async () => {
      const recipes = [
        {
          recipeId: testRecipeId,
          mealDate: new Date('2024-01-02'),
          mealType: MealType.BREAKFAST,
        },
        {
          recipeId: BigInt(2),
          mealDate: new Date('2024-01-02'),
          mealType: MealType.LUNCH,
        },
      ];

      const expectedRecipes = recipes.map((recipe, index) => ({
        mealPlanId: testMealPlanId,
        ...recipe,
        recipe: {
          recipeId: recipe.recipeId,
          title: `Recipe ${index + 1}`,
          userId: testUserId,
        },
      }));

      mockTx.mealPlanRecipe.createMany.mockResolvedValue({ count: 2 });
      mockTx.mealPlanRecipe.findMany.mockResolvedValue(expectedRecipes);

      const result = await repository.addMultipleRecipes(testMealPlanId, recipes, mockTx);

      expect(result).toEqual(expectedRecipes);
      expect(mockTx.mealPlanRecipe.createMany).toHaveBeenCalledWith({
        data: recipes.map((recipe) => ({
          mealPlanId: testMealPlanId,
          ...recipe,
        })),
      });
    });
  });

  describe('removeMultipleRecipes', () => {
    it('should remove multiple recipes from a meal plan', async () => {
      const recipesToRemove = [
        {
          recipeId: testRecipeId,
          mealDate: new Date('2024-01-02'),
        },
        {
          recipeId: BigInt(2),
          mealDate: new Date('2024-01-03'),
        },
      ];

      mockTx.mealPlanRecipe.deleteMany.mockResolvedValue({ count: 2 });

      const result = await repository.removeMultipleRecipes(
        testMealPlanId,
        recipesToRemove,
        mockTx,
      );

      expect(result).toBe(2);
      expect(mockTx.mealPlanRecipe.deleteMany).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          OR: recipesToRemove.map((recipe) => ({
            recipeId: recipe.recipeId,
            mealDate: recipe.mealDate,
          })),
        },
      });
    });
  });

  describe('replaceRecipesForDate', () => {
    it('should replace all recipes for a specific date', async () => {
      const mealDate = new Date('2024-01-02');
      const newRecipes = [
        {
          recipeId: testRecipeId,
          mealType: MealType.BREAKFAST,
        },
        {
          recipeId: BigInt(2),
          mealType: MealType.DINNER,
        },
      ];

      const expectedRecipes = newRecipes.map((recipe) => ({
        mealPlanId: testMealPlanId,
        mealDate,
        ...recipe,
        recipe: {
          recipeId: recipe.recipeId,
          title: `Recipe ${recipe.recipeId}`,
          userId: testUserId,
        },
      }));

      mockTx.mealPlanRecipe.deleteMany.mockResolvedValue({ count: 3 });
      mockTx.mealPlanRecipe.createMany.mockResolvedValue({ count: 2 });
      mockTx.mealPlanRecipe.findMany.mockResolvedValue(expectedRecipes);

      const result = await repository.replaceRecipesForDate(
        testMealPlanId,
        mealDate,
        newRecipes,
        mockTx,
      );

      expect(result).toEqual(expectedRecipes);
      expect(mockTx.mealPlanRecipe.deleteMany).toHaveBeenCalledWith({
        where: {
          mealPlanId: testMealPlanId,
          mealDate,
        },
      });
      expect(mockTx.mealPlanRecipe.createMany).toHaveBeenCalledWith({
        data: newRecipes.map((recipe) => ({
          mealPlanId: testMealPlanId,
          mealDate,
          ...recipe,
        })),
      });
    });

    it('should return empty array when no new recipes provided', async () => {
      const mealDate = new Date('2024-01-02');

      mockTx.mealPlanRecipe.deleteMany.mockResolvedValue({ count: 2 });

      const result = await repository.replaceRecipesForDate(testMealPlanId, mealDate, [], mockTx);

      expect(result).toEqual([]);
      expect(mockTx.mealPlanRecipe.createMany).not.toHaveBeenCalled();
      expect(mockTx.mealPlanRecipe.findMany).not.toHaveBeenCalled();
    });
  });

  describe('cloneMealPlan', () => {
    it('should clone a meal plan with all recipes', async () => {
      const sourceMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Source Plan',
        description: 'Original plan',
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
          },
          {
            mealPlanId: testMealPlanId,
            recipeId: BigInt(2),
            mealDate: new Date('2024-01-03'),
            mealType: MealType.LUNCH,
          },
        ],
      };

      const targetData = {
        userId: testUserId,
        name: 'Cloned Plan',
        description: 'Cloned from original',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-07'),
      };

      const clonedMealPlan = {
        mealPlanId: BigInt(2),
        ...targetData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult = {
        ...clonedMealPlan,
        mealPlanRecipes: [
          {
            mealPlanId: BigInt(2),
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-09'), // 7 days offset
            mealType: MealType.BREAKFAST,
            recipe: {
              recipeId: testRecipeId,
              title: 'Recipe 1',
              userId: testUserId,
            },
          },
          {
            mealPlanId: BigInt(2),
            recipeId: BigInt(2),
            mealDate: new Date('2024-01-10'), // 7 days offset
            mealType: MealType.LUNCH,
            recipe: {
              recipeId: BigInt(2),
              title: 'Recipe 2',
              userId: testUserId,
            },
          },
        ],
      };

      mockTx.mealPlan.findUnique.mockResolvedValueOnce(sourceMealPlan);
      mockTx.mealPlan.create.mockResolvedValue(clonedMealPlan);
      mockTx.mealPlanRecipe.createMany.mockResolvedValue({ count: 2 });
      mockTx.mealPlan.findUnique.mockResolvedValueOnce(expectedResult);

      const result = await repository.cloneMealPlan(
        testMealPlanId,
        targetData,
        7, // 7 day offset
        mockTx,
      );

      expect(result).toEqual(expectedResult);
      expect(mockTx.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        include: {
          mealPlanRecipes: true,
        },
      });
      expect(mockTx.mealPlanRecipe.createMany).toHaveBeenCalledWith({
        data: [
          {
            mealPlanId: BigInt(2),
            recipeId: testRecipeId,
            mealDate: new Date('2024-01-09'),
            mealType: MealType.BREAKFAST,
          },
          {
            mealPlanId: BigInt(2),
            recipeId: BigInt(2),
            mealDate: new Date('2024-01-10'),
            mealType: MealType.LUNCH,
          },
        ],
      });
    });

    it('should throw error when source meal plan not found', async () => {
      const targetData = {
        userId: testUserId,
        name: 'Cloned Plan',
      };

      mockTx.mealPlan.findUnique.mockResolvedValue(null);

      await expect(repository.cloneMealPlan(BigInt(999), targetData, 0, mockTx)).rejects.toThrow(
        'Source meal plan not found',
      );
    });

    it('should clone meal plan without recipes when source has none', async () => {
      const sourceMealPlan = {
        mealPlanId: testMealPlanId,
        userId: testUserId,
        name: 'Source Plan',
        description: null,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        mealPlanRecipes: [],
      };

      const targetData = {
        userId: testUserId,
        name: 'Empty Clone',
      };

      const clonedMealPlan = {
        mealPlanId: BigInt(2),
        ...targetData,
        description: null,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult = {
        ...clonedMealPlan,
        mealPlanRecipes: [],
      };

      mockTx.mealPlan.findUnique.mockResolvedValueOnce(sourceMealPlan);
      mockTx.mealPlan.create.mockResolvedValue(clonedMealPlan);
      mockTx.mealPlan.findUnique.mockResolvedValueOnce(expectedResult);

      const result = await repository.cloneMealPlan(testMealPlanId, targetData, 0, mockTx);

      expect(result).toEqual(expectedResult);
      expect(mockTx.mealPlanRecipe.createMany).not.toHaveBeenCalled();
    });
  });
});
