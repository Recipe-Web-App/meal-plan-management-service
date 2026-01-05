/**
 * Jest-compatible mock for Prisma 7.0 generated client
 * This file provides type-compatible exports for testing without ESM syntax
 */

// Re-export the MealType enum
export const MealType = {
  BREAKFAST: 'BREAKFAST',
  LUNCH: 'LUNCH',
  DINNER: 'DINNER',
  SNACK: 'SNACK',
  DESSERT: 'DESSERT',
} as const;

export type MealType = (typeof MealType)[keyof typeof MealType];

// Type definitions for models
export interface User {
  userId: string;
  username: string;
}

export interface Recipe {
  recipeId: bigint;
  userId: string;
  title: string;
}

export interface MealPlan {
  mealPlanId: bigint;
  userId: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealPlanRecipe {
  mealPlanId: bigint;
  recipeId: bigint;
  mealDate: Date;
  mealType: MealType;
}

// Prisma namespace for types like Prisma.TransactionClient
// eslint-disable-next-line @typescript-eslint/no-namespace -- Required to match Prisma's exported type structure
export namespace Prisma {
  export type TransactionClient = PrismaClient;
  export type TransactionIsolationLevel =
    | 'ReadUncommitted'
    | 'ReadCommitted'
    | 'RepeatableRead'
    | 'Serializable';
  export type QueryMode = 'default' | 'insensitive';

  // Input types - simplified versions
  export interface MealPlanWhereInput {
    AND?: MealPlanWhereInput | MealPlanWhereInput[];
    OR?: MealPlanWhereInput[];
    NOT?: MealPlanWhereInput | MealPlanWhereInput[];
    mealPlanId?: bigint | number;
    userId?: string;
    name?: string;
    [key: string]: unknown;
  }

  export interface MealPlanRecipeWhereInput {
    mealPlanId?: bigint | number;
    recipeId?: bigint | number;
    mealDate?: Date;
    mealType?: MealType;
    [key: string]: unknown;
  }

  export interface MealPlanOrderByWithRelationInput {
    [key: string]: 'asc' | 'desc';
  }
}

// Mock PrismaClient class
export class PrismaClient {
  user: unknown;
  recipe: unknown;
  mealPlan: unknown;
  mealPlanRecipe: unknown;
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $transaction: <T>(fn: (prisma: PrismaClient) => Promise<T>, options?: unknown) => Promise<T>;
  $queryRaw: unknown;
  $on: (event: string, listener: unknown) => void;

  constructor(_options?: unknown) {
    this.user = {};
    this.recipe = {};
    this.mealPlan = {};
    this.mealPlanRecipe = {};
    this.$connect = async () => {};
    this.$disconnect = async () => {};
    this.$transaction = (fn) => fn(this);
    this.$queryRaw = () => Promise.resolve([]);
    this.$on = () => {};
  }
}
