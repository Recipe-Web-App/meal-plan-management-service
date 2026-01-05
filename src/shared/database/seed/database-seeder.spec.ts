/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, afterEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseSeeder } from './database-seeder';
import { PrismaService } from '@/config/database.config';
import { TransactionService, type TransactionClient } from '../transaction.service';
import { LoggerService } from '@/shared/services/logger.service';
import { MealType } from '@generated/prisma/client';

describe('DatabaseSeeder', () => {
  let seeder: DatabaseSeeder;
  let prismaService: {
    user: { create: Mock<() => Promise<unknown>>; deleteMany: Mock<() => Promise<unknown>> };
    recipe: { create: Mock<() => Promise<unknown>>; deleteMany: Mock<() => Promise<unknown>> };
    mealPlan: { create: Mock<() => Promise<unknown>>; deleteMany: Mock<() => Promise<unknown>> };
    mealPlanRecipe: {
      create: Mock<() => Promise<unknown>>;
      deleteMany: Mock<() => Promise<unknown>>;
    };
  };
  let transactionService: {
    executeTransaction: Mock<(fn: (client: unknown) => Promise<unknown>) => Promise<unknown>>;
  };
  let loggerService: {
    log: Mock<() => void>;
    error: Mock<() => void>;
    warn: Mock<() => void>;
    debug: Mock<() => void>;
    info: Mock<() => void>;
  };

  const mockTransactionClient = {
    user: {
      create: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({})),
    },
    recipe: {
      create: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({})),
    },
    mealPlan: {
      create: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({})),
    },
    mealPlanRecipe: {
      create: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({})),
    },
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        create: mock(() => Promise.resolve({})),
        deleteMany: mock(() => Promise.resolve({})),
      },
      recipe: {
        create: mock(() => Promise.resolve({})),
        deleteMany: mock(() => Promise.resolve({})),
      },
      mealPlan: {
        create: mock(() => Promise.resolve({})),
        deleteMany: mock(() => Promise.resolve({})),
      },
      mealPlanRecipe: {
        create: mock(() => Promise.resolve({})),
        deleteMany: mock(() => Promise.resolve({})),
      },
    };

    transactionService = {
      executeTransaction: mock(async (fn: (client: unknown) => Promise<unknown>) => {
        return fn(mockTransactionClient as any);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseSeeder,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: TransactionService,
          useValue: transactionService,
        },
      ],
    }).compile();

    seeder = module.get<DatabaseSeeder>(DatabaseSeeder);
    prismaService = module.get(PrismaService);
    transactionService = module.get(TransactionService);
    loggerService = {
      log: mock(() => {}),
      error: mock(() => {}),
      warn: mock(() => {}),
      debug: mock(() => {}),
      info: mock(() => {}),
    };
  });

  afterEach(() => {
    mockTransactionClient.user.create.mockClear();
    mockTransactionClient.user.deleteMany.mockClear();
    mockTransactionClient.recipe.create.mockClear();
    mockTransactionClient.recipe.deleteMany.mockClear();
    mockTransactionClient.mealPlan.create.mockClear();
    mockTransactionClient.mealPlan.deleteMany.mockClear();
    mockTransactionClient.mealPlanRecipe.create.mockClear();
    mockTransactionClient.mealPlanRecipe.deleteMany.mockClear();
  });

  describe('seedAll', () => {
    it('should seed database with default options', async () => {
      // Mock the transaction service to execute the callback and return the result
      transactionService.executeTransaction.mockImplementation(
        async (callback: (tx: TransactionClient) => Promise<unknown>) => {
          const mockUser = {
            userId: 'user-1',
            username: 'TestUser',
          };
          const mockRecipe = {
            recipeId: BigInt(1),
            title: 'Test Recipe',
          };
          const mockMealPlan = {
            mealPlanId: BigInt(1),
            userId: 'user-1',
            name: 'Test Plan',
            startDate: new Date(),
            endDate: new Date(),
          };

          mockTransactionClient.user.create.mockResolvedValue(mockUser as any);
          mockTransactionClient.recipe.create.mockResolvedValue(mockRecipe as any);
          mockTransactionClient.mealPlan.create.mockResolvedValue(mockMealPlan as any);
          mockTransactionClient.mealPlanRecipe.create.mockResolvedValue({
            id: 'plan-recipe-1',
          } as any);

          return callback(mockTransactionClient as any);
        },
      );

      const result = await seeder.seedAll();

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('recipes');
      expect(result).toHaveProperty('mealPlans');
      expect(result).toHaveProperty('mealPlanRecipes');
      expect(result).toHaveProperty('duration');

      expect(result.users).toBeGreaterThan(0);
      expect(result.recipes).toBeGreaterThan(0);
      expect(result.mealPlans).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should seed with custom options', async () => {
      const options = {
        users: 2,
        recipes: 5,
        mealPlans: 1,
        recipesPerPlan: 3,
        cleanFirst: false,
      };

      // Mock the transaction service to execute the callback and return the result
      transactionService.executeTransaction.mockImplementation(
        async (callback: (tx: TransactionClient) => Promise<unknown>) => {
          const mockUser = {
            userId: 'user-1',
            username: 'TestUser',
          };
          const mockRecipe = {
            recipeId: BigInt(1),
            title: 'Test Recipe',
          };
          const mockMealPlan = {
            mealPlanId: BigInt(1),
            userId: 'user-1',
            name: 'Test Plan',
            startDate: new Date(),
            endDate: new Date(),
          };

          mockTransactionClient.user.create.mockResolvedValue(mockUser as any);
          mockTransactionClient.recipe.create.mockResolvedValue(mockRecipe as any);
          mockTransactionClient.mealPlan.create.mockResolvedValue(mockMealPlan as any);
          mockTransactionClient.mealPlanRecipe.create.mockResolvedValue({
            id: 'plan-recipe-1',
          } as any);

          return callback(mockTransactionClient as any);
        },
      );

      await seeder.seedAll(options);

      expect(mockTransactionClient.user.create).toHaveBeenCalledTimes(options.users);
      expect(mockTransactionClient.recipe.create).toHaveBeenCalledTimes(options.recipes);
    });

    it('should clean database when cleanFirst is true', async () => {
      const options = { cleanFirst: true };

      // Mock the transaction service to execute the callback and return the result
      transactionService.executeTransaction.mockImplementation(
        async (callback: (tx: TransactionClient) => Promise<unknown>) => {
          const mockUser = {
            userId: 'user-1',
            username: 'TestUser',
          };
          const mockRecipe = {
            recipeId: BigInt(1),
            title: 'Test Recipe',
          };
          const mockMealPlan = {
            mealPlanId: BigInt(1),
            userId: 'user-1',
            name: 'Test Plan',
            startDate: new Date(),
            endDate: new Date(),
          };

          mockTransactionClient.user.create.mockResolvedValue(mockUser as any);
          mockTransactionClient.recipe.create.mockResolvedValue(mockRecipe as any);
          mockTransactionClient.mealPlan.create.mockResolvedValue(mockMealPlan as any);
          mockTransactionClient.mealPlanRecipe.create.mockResolvedValue({
            id: 'plan-recipe-1',
          } as any);

          return callback(mockTransactionClient as any);
        },
      );

      await seeder.seedAll(options);

      expect(mockTransactionClient.mealPlanRecipe.deleteMany).toHaveBeenCalled();
      expect(mockTransactionClient.mealPlan.deleteMany).toHaveBeenCalled();
      expect(mockTransactionClient.recipe.deleteMany).toHaveBeenCalled();
      expect(mockTransactionClient.user.deleteMany).toHaveBeenCalled();
    });

    it('should handle seeding errors', async () => {
      const error = new Error('Database error');
      transactionService.executeTransaction.mockRejectedValue(error);

      expect(seeder.seedAll()).rejects.toThrow('Database error');
    });
  });

  describe('seedUsers', () => {
    it('should create specified number of users', async () => {
      const count = 3;
      const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' };

      prismaService.user.create.mockResolvedValue(mockUser as any);

      const result = await seeder.seedUsers(count);

      expect(result).toHaveLength(count);
      expect(prismaService.user.create).toHaveBeenCalledTimes(count);
      result.forEach((user) => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
      });
    });
  });

  describe('seedRecipes', () => {
    it('should create specified number of recipes', async () => {
      const count = 5;
      const mockRecipe = { id: 'recipe-1', title: 'Test Recipe' };

      prismaService.recipe.create.mockResolvedValue(mockRecipe as any);

      const result = await seeder.seedRecipes(count);

      expect(result).toHaveLength(count);
      expect(prismaService.recipe.create).toHaveBeenCalledTimes(count);
      result.forEach((recipe) => {
        expect(recipe).toHaveProperty('id');
        expect(recipe).toHaveProperty('title');
      });
    });
  });

  describe('seedMealPlanForUser', () => {
    it('should create meal plan with recipes for user', async () => {
      const userId = 'user-123';
      const recipeIds = [BigInt(1), BigInt(2), BigInt(3)];
      const options = {
        name: 'Test Plan',
        startDate: new Date('2023-01-01'),
        daysCount: 3,
      };

      const mockMealPlan = { mealPlanId: BigInt(1), name: 'Test Plan' };

      transactionService.executeTransaction.mockImplementation(
        async (fn: (tx: TransactionClient) => Promise<unknown>) => {
          const mockTx = {
            mealPlan: {
              create: mock(() => Promise.resolve(mockMealPlan)),
            },
            mealPlanRecipe: {
              create: mock(() => Promise.resolve({ id: 'plan-recipe-1' })),
            },
          };
          return fn(mockTx as any);
        },
      );

      const result = await seeder.seedMealPlanForUser(userId, recipeIds, options);

      expect(result.mealPlan.name).toBe(options.name);
      expect(result.recipesAdded).toBe(recipeIds.length);
    });
  });

  describe('cleanDatabase', () => {
    it('should delete all data in correct order', async () => {
      await seeder.cleanDatabase();

      expect(prismaService.mealPlanRecipe.deleteMany).toHaveBeenCalled();
      expect(prismaService.mealPlan.deleteMany).toHaveBeenCalled();
      expect(prismaService.recipe.deleteMany).toHaveBeenCalled();
      expect(prismaService.user.deleteMany).toHaveBeenCalled();
    });

    it('should use transaction client when provided', async () => {
      const mockTx = {
        mealPlanRecipe: { deleteMany: mock(() => Promise.resolve({})) },
        mealPlan: { deleteMany: mock(() => Promise.resolve({})) },
        recipe: { deleteMany: mock(() => Promise.resolve({})) },
        user: { deleteMany: mock(() => Promise.resolve({})) },
      };

      await seeder.cleanDatabase(mockTx);

      expect(mockTx.mealPlanRecipe.deleteMany).toHaveBeenCalled();
      expect(mockTx.mealPlan.deleteMany).toHaveBeenCalled();
      expect(mockTx.recipe.deleteMany).toHaveBeenCalled();
      expect(mockTx.user.deleteMany).toHaveBeenCalled();
    });
  });

  describe('private methods', () => {
    it('should create meal plan recipes with proper distribution', () => {
      const mealPlanId = BigInt(123);
      const recipeIds = Array.from({ length: 21 }, (_, i) => BigInt(i));
      const startDate = new Date('2023-01-01');

      // Access private method using type assertion
      const createMealPlanRecipes = (seeder as any).createMealPlanRecipes;
      const recipes = createMealPlanRecipes(mealPlanId, recipeIds, startDate);

      expect(recipes.length).toBe(20);

      // Check meal type distribution
      const mealTypeCounts = recipes.reduce(
        (acc: Record<MealType, number>, recipe: any) => {
          acc[recipe.mealType as MealType] = (acc[recipe.mealType as MealType] || 0) + 1;
          return acc;
        },
        {} as Record<MealType, number>,
      );

      expect(mealTypeCounts[MealType.BREAKFAST]).toBeGreaterThan(0);
      expect(mealTypeCounts[MealType.LUNCH]).toBeGreaterThan(0);
      expect(mealTypeCounts[MealType.DINNER]).toBeGreaterThan(0);

      // Check date distribution
      const dates = recipes.map((recipe: any) => recipe.mealDate.toDateString());
      const uniqueDates = new Set(dates);
      expect(uniqueDates.size).toBe(7); // 7 days
    });

    it('should handle fewer recipes than week span', () => {
      const mealPlanId = 'plan-123';
      const recipeIds = ['recipe-1', 'recipe-2'];
      const startDate = new Date('2023-01-01');

      const createMealPlanRecipes = (seeder as any).createMealPlanRecipes;
      const recipes = createMealPlanRecipes(mealPlanId, recipeIds, startDate);

      expect(recipes.length).toBe(2);
      recipes.forEach((recipe: any, index: number) => {
        expect(recipe.recipeId).toBe(recipeIds[index]);
      });
    });
  });
});
