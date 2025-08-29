import { TestDatabase } from './test-database';
import { PrismaService } from '@/config/database.config';
import { LoggerService } from '@/shared/services/logger.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { MealType } from '@prisma/client';

describe('TestDatabase', () => {
  let testDb: TestDatabase;
  let prismaService: DeepMockProxy<PrismaService>;
  let loggerService: DeepMockProxy<LoggerService>;

  beforeEach(() => {
    prismaService = mockDeep<PrismaService>();
    loggerService = mockDeep<LoggerService>();

    testDb = new TestDatabase({
      prisma: prismaService,
      logger: loggerService,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should clean database on setup', async () => {
      prismaService.mealPlanRecipe.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.mealPlan.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.recipe.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.user.deleteMany.mockResolvedValue({ count: 0 });

      await testDb.setup();

      expect(prismaService.mealPlanRecipe.deleteMany).toHaveBeenCalled();
      expect(prismaService.mealPlan.deleteMany).toHaveBeenCalled();
      expect(prismaService.recipe.deleteMany).toHaveBeenCalled();
      expect(prismaService.user.deleteMany).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean database on cleanup', async () => {
      prismaService.mealPlanRecipe.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.mealPlan.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.recipe.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.user.deleteMany.mockResolvedValue({ count: 0 });

      await testDb.cleanup();

      expect(prismaService.mealPlanRecipe.deleteMany).toHaveBeenCalled();
      expect(prismaService.mealPlan.deleteMany).toHaveBeenCalled();
      expect(prismaService.recipe.deleteMany).toHaveBeenCalled();
      expect(prismaService.user.deleteMany).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create user with factory data', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await testDb.createUser();

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
        }),
      });
      expect(result).toEqual(mockUser);
    });

    it('should create user with custom overrides', async () => {
      const overrides = {
        name: 'Custom User',
        email: 'custom@example.com',
      };

      const mockUser = {
        id: 'user-1',
        name: overrides.name,
        email: overrides.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.create.mockResolvedValue(mockUser);

      await testDb.createUser(overrides);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining(overrides),
      });
    });
  });

  describe('createUsers', () => {
    it('should create multiple users', async () => {
      const count = 3;
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await testDb.createUsers(count);

      expect(result).toHaveLength(count);
      expect(prismaService.user.create).toHaveBeenCalledTimes(count);
    });

    it('should create users with shared overrides', async () => {
      const count = 2;
      const overrides = { name: 'Shared Name' };
      const mockUser = {
        id: 'user-1',
        name: overrides.name,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.create.mockResolvedValue(mockUser);

      await testDb.createUsers(count, overrides);

      expect(prismaService.user.create).toHaveBeenCalledTimes(count);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining(overrides),
      });
    });
  });

  describe('createRecipe', () => {
    it('should create recipe with factory data', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        title: 'Test Recipe',
        description: 'Test description',
        cookingTime: 30,
        servings: 4,
        difficulty: 'Medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.recipe.create.mockResolvedValue(mockRecipe);

      const result = await testDb.createRecipe();

      expect(prismaService.recipe.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          cookingTime: expect.any(Number),
        }),
      });
      expect(result).toEqual(mockRecipe);
    });

    it('should create recipe with custom overrides', async () => {
      const overrides = {
        title: 'Custom Recipe',
        cookingTime: 60,
      };

      const mockRecipe = {
        id: 'recipe-1',
        title: overrides.title,
        cookingTime: overrides.cookingTime,
        description: null,
        servings: 4,
        difficulty: 'Medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.recipe.create.mockResolvedValue(mockRecipe);

      await testDb.createRecipe(overrides);

      expect(prismaService.recipe.create).toHaveBeenCalledWith({
        data: expect.objectContaining(overrides),
      });
    });
  });

  describe('createRecipes', () => {
    it('should create multiple recipes', async () => {
      const count = 4;
      const mockRecipe = {
        id: 'recipe-1',
        title: 'Test Recipe',
        description: null,
        cookingTime: 30,
        servings: 4,
        difficulty: 'Medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.recipe.create.mockResolvedValue(mockRecipe);

      const result = await testDb.createRecipes(count);

      expect(result).toHaveLength(count);
      expect(prismaService.recipe.create).toHaveBeenCalledTimes(count);
    });
  });

  describe('createMealPlan', () => {
    it('should create meal plan with factory data', async () => {
      const mockMealPlan = {
        id: 'plan-1',
        userId: 'user-1',
        name: 'Test Plan',
        description: 'Test description',
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.mealPlan.create.mockResolvedValue(mockMealPlan);

      const result = await testDb.createMealPlan();

      expect(prismaService.mealPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          userId: expect.any(String),
          name: expect.any(String),
        }),
      });
      expect(result).toEqual(mockMealPlan);
    });
  });

  describe('createMealPlanWithRecipes', () => {
    it('should delegate to seeder for complex creation', async () => {
      const userId = 'user-123';
      const recipeIds = ['recipe-1', 'recipe-2'];
      const options = {
        name: 'Test Plan with Recipes',
        daysCount: 3,
      };

      // Mock the seeder method directly on the instance
      const mockResult = {
        mealPlan: { id: 'plan-1', name: 'Test Plan with Recipes' },
        recipesAdded: 2,
      };

      jest.spyOn(testDb['seeder'], 'seedMealPlanForUser').mockResolvedValue(mockResult);

      const result = await testDb.createMealPlanWithRecipes(userId, recipeIds, options);

      expect(testDb['seeder'].seedMealPlanForUser).toHaveBeenCalledWith(userId, recipeIds, options);
      expect(result).toEqual(mockResult);
    });
  });

  describe('createMealPlanRecipe', () => {
    it('should create meal plan recipe with factory data', async () => {
      const mockMealPlanRecipe = {
        id: 'plan-recipe-1',
        mealPlanId: 'plan-1',
        recipeId: 'recipe-1',
        plannedDate: new Date(),
        mealType: MealType.DINNER,
        servings: 4,
        notes: null,
        createdAt: new Date(),
      };

      prismaService.mealPlanRecipe.create.mockResolvedValue(mockMealPlanRecipe);

      const result = await testDb.createMealPlanRecipe();

      expect(prismaService.mealPlanRecipe.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          mealPlanId: expect.any(String),
          recipeId: expect.any(String),
          plannedDate: expect.any(Date),
          mealType: expect.any(String),
          servings: expect.any(Number),
        }),
      });
      expect(result).toEqual(mockMealPlanRecipe);
    });

    it('should create meal plan recipe with custom overrides', async () => {
      const overrides = {
        mealPlanId: 'custom-plan',
        recipeId: 'custom-recipe',
        mealType: MealType.BREAKFAST,
        servings: 2,
      };

      const mockMealPlanRecipe = {
        id: 'plan-recipe-1',
        ...overrides,
        plannedDate: new Date(),
        notes: null,
        createdAt: new Date(),
      };

      prismaService.mealPlanRecipe.create.mockResolvedValue(mockMealPlanRecipe);

      await testDb.createMealPlanRecipe(overrides);

      expect(prismaService.mealPlanRecipe.create).toHaveBeenCalledWith({
        data: expect.objectContaining(overrides),
      });
    });
  });

  describe('seedTestData', () => {
    it('should delegate to seeder with test-specific defaults', async () => {
      const mockResult = {
        users: 3,
        recipes: 10,
        mealPlans: 2,
        mealPlanRecipes: 10,
        duration: 100,
      };

      jest.spyOn(testDb['seeder'], 'seedAll').mockResolvedValue(mockResult);

      const result = await testDb.seedTestData();

      expect(testDb['seeder'].seedAll).toHaveBeenCalledWith({
        users: 3,
        recipes: 10,
        mealPlans: 2,
        recipesPerPlan: 5,
        cleanFirst: false,
      });
      expect(result).toEqual(mockResult);
    });

    it('should accept custom options', async () => {
      const customOptions = {
        users: 5,
        cleanFirst: true,
      };

      const mockResult = {
        users: 5,
        recipes: 10,
        mealPlans: 2,
        mealPlanRecipes: 10,
        duration: 100,
      };

      jest.spyOn(testDb['seeder'], 'seedAll').mockResolvedValue(mockResult);

      await testDb.seedTestData(customOptions);

      expect(testDb['seeder'].seedAll).toHaveBeenCalledWith({
        users: 5,
        recipes: 10,
        mealPlans: 2,
        recipesPerPlan: 5,
        cleanFirst: true,
      });
    });
  });

  describe('factories', () => {
    it('should expose factories for direct use', () => {
      const factories = testDb.factories;

      expect(factories).toHaveProperty('user');
      expect(factories).toHaveProperty('recipe');
      expect(factories).toHaveProperty('mealPlan');

      expect(factories.user.create).toBeDefined();
      expect(factories.recipe.create).toBeDefined();
      expect(factories.mealPlan.create).toBeDefined();
    });
  });

  describe('prisma', () => {
    it('should expose prisma service', () => {
      const prisma = testDb.prisma;
      expect(prisma).toBe(prismaService);
    });
  });

  describe('logger fallback', () => {
    it('should work without logger provided', () => {
      const testDbWithoutLogger = new TestDatabase({
        prisma: prismaService,
      });

      expect(testDbWithoutLogger).toBeDefined();
      expect(testDbWithoutLogger.prisma).toBe(prismaService);
    });
  });
});
