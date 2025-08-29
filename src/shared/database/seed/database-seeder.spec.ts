/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/prefer-nullish-coalescing */
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseSeeder } from './database-seeder';
import { PrismaService } from '@/config/database.config';
import { TransactionService } from '../transaction.service';
import { LoggerService } from '@/shared/services/logger.service';
import { MealType } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('DatabaseSeeder', () => {
  let seeder: DatabaseSeeder;
  let prismaService: DeepMockProxy<PrismaService>;
  let transactionService: DeepMockProxy<TransactionService>;
  let loggerService: DeepMockProxy<LoggerService>;

  const mockTransactionClient = {
    user: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    recipe: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    mealPlan: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    mealPlanRecipe: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseSeeder,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: TransactionService,
          useValue: mockDeep<TransactionService>(),
        },
      ],
    }).compile();

    seeder = module.get<DatabaseSeeder>(DatabaseSeeder);
    prismaService = module.get(PrismaService);
    transactionService = module.get(TransactionService);
    loggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    } as any;

    // Mock the transaction execution
    transactionService.executeInTransaction.mockImplementation(async (fn) => {
      return fn(mockTransactionClient as any);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seedAll', () => {
    it('should seed database with default options', async () => {
      // Mock successful user creation
      mockTransactionClient.user.create.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      } as any);

      // Mock successful recipe creation
      mockTransactionClient.recipe.create.mockResolvedValue({
        id: 'recipe-1',
        title: 'Test Recipe',
      } as any);

      // Mock successful meal plan creation
      mockTransactionClient.mealPlan.create.mockResolvedValue({
        id: 'plan-1',
        userId: 'user-1',
        name: 'Test Plan',
        startDate: new Date(),
        endDate: new Date(),
      } as any);

      // Mock successful meal plan recipe creation
      mockTransactionClient.mealPlanRecipe.create.mockResolvedValue({ id: 'plan-recipe-1' } as any);

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

      mockTransactionClient.user.create.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
      } as any);
      mockTransactionClient.recipe.create.mockResolvedValue({
        id: 'recipe-1',
        title: 'Test Recipe',
      } as any);
      mockTransactionClient.mealPlan.create.mockResolvedValue({
        id: 'plan-1',
        userId: 'user-1',
        startDate: new Date(),
        endDate: new Date(),
      } as any);
      mockTransactionClient.mealPlanRecipe.create.mockResolvedValue({ id: 'plan-recipe-1' } as any);

      await seeder.seedAll(options);

      expect(mockTransactionClient.user.create).toHaveBeenCalledTimes(options.users);
      expect(mockTransactionClient.recipe.create).toHaveBeenCalledTimes(options.recipes);
    });

    it('should clean database when cleanFirst is true', async () => {
      const options = { cleanFirst: true };

      mockTransactionClient.user.create.mockResolvedValue({ id: 'user-1' } as any);
      mockTransactionClient.recipe.create.mockResolvedValue({ id: 'recipe-1' } as any);
      mockTransactionClient.mealPlan.create.mockResolvedValue({
        id: 'plan-1',
        userId: 'user-1',
        startDate: new Date(),
        endDate: new Date(),
      } as any);
      mockTransactionClient.mealPlanRecipe.create.mockResolvedValue({ id: 'plan-recipe-1' } as any);

      await seeder.seedAll(options);

      expect(mockTransactionClient.mealPlanRecipe.deleteMany).toHaveBeenCalled();
      expect(mockTransactionClient.mealPlan.deleteMany).toHaveBeenCalled();
      expect(mockTransactionClient.recipe.deleteMany).toHaveBeenCalled();
      expect(mockTransactionClient.user.deleteMany).toHaveBeenCalled();
    });

    it('should handle seeding errors', async () => {
      const error = new Error('Database error');
      transactionService.executeInTransaction.mockRejectedValue(error);

      await expect(seeder.seedAll()).rejects.toThrow('Database error');
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
      const recipeIds = ['recipe-1', 'recipe-2', 'recipe-3'];
      const options = {
        name: 'Test Plan',
        startDate: new Date('2023-01-01'),
        daysCount: 3,
      };

      const mockMealPlan = { id: 'plan-1', name: 'Test Plan' };

      transactionService.executeInTransaction.mockImplementation(async (fn) => {
        const mockTx = {
          mealPlan: {
            create: jest.fn().mockResolvedValue(mockMealPlan),
          },
          mealPlanRecipe: {
            create: jest.fn().mockResolvedValue({ id: 'plan-recipe-1' }),
          },
        };
        return fn(mockTx as any);
      });

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
        mealPlanRecipe: { deleteMany: jest.fn() },
        mealPlan: { deleteMany: jest.fn() },
        recipe: { deleteMany: jest.fn() },
        user: { deleteMany: jest.fn() },
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
      const mealPlanId = 'plan-123';
      const recipeIds = Array.from({ length: 21 }, (_, i) => `recipe-${i}`);
      const startDate = new Date('2023-01-01');

      // Access private method using type assertion
      const createMealPlanRecipes = (seeder as any).createMealPlanRecipes;
      const recipes = createMealPlanRecipes(mealPlanId, recipeIds, startDate);

      expect(recipes.length).toBe(21);

      // Check meal type distribution
      const mealTypeCounts = recipes.reduce(
        (acc, recipe) => {
          acc[recipe.mealType] = (acc[recipe.mealType] || 0) + 1;
          return acc;
        },
        {} as Record<MealType, number>,
      );

      expect(mealTypeCounts[MealType.BREAKFAST]).toBeGreaterThan(0);
      expect(mealTypeCounts[MealType.LUNCH]).toBeGreaterThan(0);
      expect(mealTypeCounts[MealType.DINNER]).toBeGreaterThan(0);

      // Check date distribution
      const dates = recipes.map((recipe) => recipe.plannedDate.toDateString());
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
      recipes.forEach((recipe, index) => {
        expect(recipe.recipeId).toBe(recipeIds[index]);
      });
    });
  });
});
