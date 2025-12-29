import { describe, it, expect, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { TestDatabase } from './test-database';
import { PrismaService } from '@/config/database.config';
import { LoggerService } from '@/shared/services/logger.service';
import { MealType } from '@generated/prisma/client';

describe('TestDatabase', () => {
  let testDb: TestDatabase;
  let prismaService: {
    mealPlanRecipe: { deleteMany: Mock<() => Promise<{ count: number }>> };
    mealPlan: { deleteMany: Mock<() => Promise<{ count: number }>> };
    recipe: {
      deleteMany: Mock<() => Promise<{ count: number }>>;
      create: Mock<() => Promise<unknown>>;
    };
    user: {
      deleteMany: Mock<() => Promise<{ count: number }>>;
      create: Mock<() => Promise<unknown>>;
    };
  };
  let loggerService: {
    log: Mock<() => void>;
    error: Mock<() => void>;
    warn: Mock<() => void>;
    debug: Mock<() => void>;
    info: Mock<() => void>;
  };

  beforeEach(() => {
    prismaService = {
      mealPlanRecipe: { deleteMany: mock(() => Promise.resolve({ count: 0 })) },
      mealPlan: {
        deleteMany: mock(() => Promise.resolve({ count: 0 })),
        create: mock(() => Promise.resolve({})),
      },
      recipe: {
        deleteMany: mock(() => Promise.resolve({ count: 0 })),
        create: mock(() => Promise.resolve({})),
      },
      user: {
        deleteMany: mock(() => Promise.resolve({ count: 0 })),
        create: mock(() => Promise.resolve({})),
      },
    } as unknown as typeof prismaService;

    loggerService = {
      log: mock(() => {}),
      error: mock(() => {}),
      warn: mock(() => {}),
      debug: mock(() => {}),
      info: mock(() => {}),
    };

    testDb = new TestDatabase({
      prisma: prismaService as unknown as PrismaService,
      logger: loggerService as unknown as LoggerService,
    });
  });

  afterEach(() => {
    prismaService.mealPlanRecipe.deleteMany.mockClear();
    prismaService.mealPlan.deleteMany.mockClear();
    prismaService.recipe.deleteMany.mockClear();
    prismaService.user.deleteMany.mockClear();
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
        userId: 'user-1',
        username: 'TestUser',
      };

      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await testDb.createUser();

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: expect.any(String),
          username: expect.any(String),
        }),
      });
      expect(result).toEqual(mockUser);
    });

    it('should create user with custom overrides', async () => {
      const overrides = {
        name: 'Custom User',
      };

      const mockUser = {
        userId: 'user-1',
        username: 'Custom User',
      };

      prismaService.user.create.mockResolvedValue(mockUser);

      await testDb.createUser(overrides);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: 'Custom User',
        }),
      });
    });
  });

  describe('createUsers', () => {
    it('should create multiple users', async () => {
      const count = 3;
      const mockUser = {
        userId: 'user-1',
        username: 'Test User',
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
        userId: 'user-1',
        username: 'Shared Name',
      };

      prismaService.user.create.mockResolvedValue(mockUser);

      await testDb.createUsers(count, overrides);

      expect(prismaService.user.create).toHaveBeenCalledTimes(count);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: 'Shared Name',
        }),
      });
    });
  });

  describe('createRecipe', () => {
    it('should create recipe with factory data', async () => {
      const mockRecipe = {
        recipeId: BigInt(1),
        userId: 'user-1',
        title: 'Test Recipe',
      };

      prismaService.recipe.create.mockResolvedValue(mockRecipe);

      const result = await testDb.createRecipe();

      expect(prismaService.recipe.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipeId: expect.any(BigInt),
          userId: expect.any(String),
          title: expect.any(String),
        }),
      });
      expect(result).toEqual(mockRecipe);
    });

    it('should create recipe with custom overrides', async () => {
      const overrides = {
        title: 'Custom Recipe',
      };

      const mockRecipe = {
        recipeId: BigInt(2),
        userId: 'user-1',
        title: 'Custom Recipe',
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
        recipeId: BigInt(1),
        userId: 'user-1',
        title: 'Test Recipe',
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
        mealPlanId: BigInt(1),
        userId: 'user-1',
        name: 'Test Plan',
        description: 'Test description',
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService as any).mealPlan.create = mock(() => Promise.resolve(mockMealPlan));

      const result = await testDb.createMealPlan();

      expect((prismaService as any).mealPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mealPlanId: expect.any(BigInt),
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
      const recipeIds = ['1', '2'];
      const options = {
        name: 'Test Plan with Recipes',
        daysCount: 3,
      };

      // Mock the seeder method directly on the instance
      const mockResult = {
        mealPlan: { mealPlanId: BigInt(1), name: 'Test Plan with Recipes' },
        recipesAdded: 2,
      };

      const seedMealPlanForUserSpy = spyOn(
        testDb['seeder'],
        'seedMealPlanForUser',
      ).mockResolvedValue(mockResult as any);

      const result = await testDb.createMealPlanWithRecipes(userId, recipeIds, options);

      expect(testDb['seeder'].seedMealPlanForUser).toHaveBeenCalledWith(
        userId,
        [BigInt(1), BigInt(2)],
        options,
      );
      expect(result).toEqual(mockResult);

      seedMealPlanForUserSpy.mockRestore();
    });
  });

  describe('createMealPlanRecipe', () => {
    it('should create meal plan recipe with factory data', async () => {
      const mockMealPlanRecipe = {
        mealPlanId: BigInt(1),
        recipeId: BigInt(1),
        mealDate: new Date(),
        mealType: MealType.DINNER,
      };

      (prismaService as any).mealPlanRecipe.create = mock(() =>
        Promise.resolve(mockMealPlanRecipe),
      );

      const result = await testDb.createMealPlanRecipe();

      expect((prismaService as any).mealPlanRecipe.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mealPlanId: expect.any(BigInt),
          recipeId: expect.any(BigInt),
          mealDate: expect.any(Date),
          mealType: expect.any(String),
        }),
      });
      expect(result).toEqual(mockMealPlanRecipe);
    });

    it('should create meal plan recipe with custom overrides', async () => {
      const overrides = {
        mealPlanId: '12345',
        recipeId: '67890',
        mealType: MealType.BREAKFAST,
      };

      const mockMealPlanRecipe = {
        mealPlanId: BigInt(12345),
        recipeId: BigInt(67890),
        mealDate: new Date(),
        mealType: MealType.BREAKFAST,
      };

      (prismaService as any).mealPlanRecipe.create = mock(() =>
        Promise.resolve(mockMealPlanRecipe),
      );

      await testDb.createMealPlanRecipe(overrides);

      expect((prismaService as any).mealPlanRecipe.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mealPlanId: BigInt(12345),
          recipeId: BigInt(67890),
          mealType: MealType.BREAKFAST,
        }),
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

      const seedAllSpy = spyOn(testDb['seeder'], 'seedAll').mockResolvedValue(mockResult);

      const result = await testDb.seedTestData();

      expect(testDb['seeder'].seedAll).toHaveBeenCalledWith({
        users: 3,
        recipes: 10,
        mealPlans: 2,
        recipesPerPlan: 5,
        cleanFirst: false,
      });
      expect(result).toEqual(mockResult);

      seedAllSpy.mockRestore();
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

      const seedAllSpy = spyOn(testDb['seeder'], 'seedAll').mockResolvedValue(mockResult);

      await testDb.seedTestData(customOptions);

      expect(testDb['seeder'].seedAll).toHaveBeenCalledWith({
        users: 5,
        recipes: 10,
        mealPlans: 2,
        recipesPerPlan: 5,
        cleanFirst: true,
      });

      seedAllSpy.mockRestore();
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
        prisma: prismaService as unknown as PrismaService,
      });

      expect(testDbWithoutLogger).toBeDefined();
      expect(testDbWithoutLogger.prisma).toBe(prismaService);
    });
  });
});
