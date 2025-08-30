import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { MealPlan, MealPlanRecipe, MealType, Prisma } from '@prisma/client';
import { TransactionClient } from '@/shared/database/transaction.service';

export interface MealPlanWithRecipes extends MealPlan {
  mealPlanRecipes: (MealPlanRecipe & {
    recipe: {
      recipeId: bigint;
      title: string;
      userId: string;
    };
  })[];
}

export interface CreateMealPlanData {
  userId: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateMealPlanData {
  name?: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface AddRecipeToMealPlanData {
  mealPlanId: bigint;
  recipeId: bigint;
  mealDate: Date;
  mealType: MealType;
}

export interface MealPlanFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateMealPlanWithRecipesData extends CreateMealPlanData {
  recipes?: AddRecipeToMealPlanData[];
}

@Injectable()
export class MealPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMealPlanData): Promise<MealPlan> {
    return this.prisma.mealPlan.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        user: {
          connect: { userId: data.userId },
        },
      },
    });
  }

  async findById(mealPlanId: bigint): Promise<MealPlan | null> {
    return this.prisma.mealPlan.findUnique({
      where: { mealPlanId },
    });
  }

  async findByIdWithRecipes(mealPlanId: bigint): Promise<MealPlanWithRecipes | null> {
    return this.prisma.mealPlan.findUnique({
      where: { mealPlanId },
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
  }

  async findByUser(userId: string): Promise<MealPlan[]> {
    return this.prisma.mealPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByFilters(filters: MealPlanFilters): Promise<MealPlan[]> {
    const where: Prisma.MealPlanWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Find meal plans that overlap with the given date range
    if (filters.startDate || filters.endDate) {
      where.AND = [];

      if (filters.endDate) {
        where.AND.push({
          OR: [{ startDate: { lte: filters.endDate } }, { startDate: null }],
        });
      }

      if (filters.startDate) {
        where.AND.push({
          OR: [{ endDate: { gte: filters.startDate } }, { endDate: null }],
        });
      }
    }

    return this.prisma.mealPlan.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async update(mealPlanId: bigint, data: UpdateMealPlanData): Promise<MealPlan> {
    return this.prisma.mealPlan.update({
      where: { mealPlanId },
      data,
    });
  }

  async delete(mealPlanId: bigint): Promise<MealPlan> {
    return this.prisma.mealPlan.delete({
      where: { mealPlanId },
    });
  }

  async addRecipeToMealPlan(data: AddRecipeToMealPlanData): Promise<MealPlanRecipe> {
    return this.prisma.mealPlanRecipe.create({
      data: {
        mealPlanId: data.mealPlanId,
        recipeId: data.recipeId,
        mealDate: data.mealDate,
        mealType: data.mealType,
      },
    });
  }

  async removeRecipeFromMealPlan(
    mealPlanId: bigint,
    recipeId: bigint,
    mealDate: Date,
  ): Promise<MealPlanRecipe> {
    return this.prisma.mealPlanRecipe.delete({
      where: {
        mealPlanId_recipeId_mealDate: {
          mealPlanId,
          recipeId,
          mealDate,
        },
      },
    });
  }

  async findRecipesForMealPlan(mealPlanId: bigint): Promise<MealPlanRecipe[]> {
    return this.prisma.mealPlanRecipe.findMany({
      where: { mealPlanId },
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
    });
  }

  async findRecipesForDate(mealPlanId: bigint, mealDate: Date): Promise<MealPlanRecipe[]> {
    return this.prisma.mealPlanRecipe.findMany({
      where: {
        mealPlanId,
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
  }

  async countMealsByType(mealPlanId: bigint) {
    return this.prisma.mealPlanRecipe.groupBy({
      by: ['mealType'],
      where: { mealPlanId },
      _count: {
        mealType: true,
      },
    });
  }

  async existsByIdAndUser(mealPlanId: bigint, userId: string): Promise<boolean> {
    const count = await this.prisma.mealPlan.count({
      where: {
        mealPlanId,
        userId,
      },
    });
    return count > 0;
  }

  async recipeExistsInMealPlan(
    mealPlanId: bigint,
    recipeId: bigint,
    mealDate: Date,
  ): Promise<boolean> {
    const count = await this.prisma.mealPlanRecipe.count({
      where: {
        mealPlanId,
        recipeId,
        mealDate,
      },
    });
    return count > 0;
  }

  // Transaction-aware methods

  /**
   * Create a meal plan with recipes in a single transaction
   */
  async createWithRecipes(
    data: CreateMealPlanWithRecipesData,
    tx?: TransactionClient,
  ): Promise<MealPlanWithRecipes> {
    const client = tx ?? this.prisma;

    // Create the meal plan
    const mealPlan = await client.mealPlan.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        user: {
          connect: { userId: data.userId },
        },
      },
    });

    // Add recipes if provided
    if (data.recipes && data.recipes.length > 0) {
      const recipeData = data.recipes.map((recipe) => ({
        mealPlanId: mealPlan.mealPlanId,
        recipeId: recipe.recipeId,
        mealDate: recipe.mealDate,
        mealType: recipe.mealType,
      }));

      await client.mealPlanRecipe.createMany({
        data: recipeData,
      });
    }

    // Return meal plan with recipes
    return client.mealPlan.findUnique({
      where: { mealPlanId: mealPlan.mealPlanId },
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
    }) as Promise<MealPlanWithRecipes>;
  }

  /**
   * Add multiple recipes to a meal plan in a single transaction
   */
  async addMultipleRecipes(
    mealPlanId: bigint,
    recipes: Omit<AddRecipeToMealPlanData, 'mealPlanId'>[],
    tx?: TransactionClient,
  ): Promise<MealPlanRecipe[]> {
    const client = tx ?? this.prisma;

    const recipeData = recipes.map((recipe) => ({
      mealPlanId,
      recipeId: recipe.recipeId,
      mealDate: recipe.mealDate,
      mealType: recipe.mealType,
    }));

    await client.mealPlanRecipe.createMany({
      data: recipeData,
    });

    // Return the created records
    return client.mealPlanRecipe.findMany({
      where: {
        mealPlanId,
        OR: recipes.map((recipe) => ({
          recipeId: recipe.recipeId,
          mealDate: recipe.mealDate,
          mealType: recipe.mealType,
        })),
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
    });
  }

  /**
   * Remove multiple recipes from a meal plan in a single transaction
   */
  async removeMultipleRecipes(
    mealPlanId: bigint,
    recipes: Array<{
      recipeId: bigint;
      mealDate: Date;
    }>,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;

    const result = await client.mealPlanRecipe.deleteMany({
      where: {
        mealPlanId,
        OR: recipes.map((recipe) => ({
          recipeId: recipe.recipeId,
          mealDate: recipe.mealDate,
        })),
      },
    });

    return result.count;
  }

  /**
   * Replace all recipes for a specific date in a meal plan
   */
  async replaceRecipesForDate(
    mealPlanId: bigint,
    mealDate: Date,
    newRecipes: Omit<AddRecipeToMealPlanData, 'mealPlanId' | 'mealDate'>[],
    tx?: TransactionClient,
  ): Promise<MealPlanRecipe[]> {
    const client = tx ?? this.prisma;

    // Remove existing recipes for the date
    await client.mealPlanRecipe.deleteMany({
      where: {
        mealPlanId,
        mealDate,
      },
    });

    // Add new recipes if provided
    if (newRecipes.length > 0) {
      const recipeData = newRecipes.map((recipe) => ({
        mealPlanId,
        recipeId: recipe.recipeId,
        mealDate,
        mealType: recipe.mealType,
      }));

      await client.mealPlanRecipe.createMany({
        data: recipeData,
      });

      return client.mealPlanRecipe.findMany({
        where: {
          mealPlanId,
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
    }

    return [];
  }

  /**
   * Clone a meal plan with all its recipes to a new date range
   */
  async cloneMealPlan(
    sourceMealPlanId: bigint,
    targetData: CreateMealPlanData,
    dayOffset: number = 0,
    tx?: TransactionClient,
  ): Promise<MealPlanWithRecipes> {
    const client = tx ?? this.prisma;

    // Get source meal plan with recipes
    const sourceMealPlan = await client.mealPlan.findUnique({
      where: { mealPlanId: sourceMealPlanId },
      include: {
        mealPlanRecipes: true,
      },
    });

    if (!sourceMealPlan) {
      throw new Error('Source meal plan not found');
    }

    // Create new meal plan
    const newMealPlan = await client.mealPlan.create({
      data: {
        name: targetData.name,
        description: targetData.description ?? null,
        startDate: targetData.startDate ?? null,
        endDate: targetData.endDate ?? null,
        user: {
          connect: { userId: targetData.userId },
        },
      },
    });

    // Clone recipes with date offset
    if (sourceMealPlan.mealPlanRecipes.length > 0) {
      const clonedRecipes = sourceMealPlan.mealPlanRecipes.map((recipe) => {
        const newDate = new Date(recipe.mealDate);
        newDate.setDate(newDate.getDate() + dayOffset);

        return {
          mealPlanId: newMealPlan.mealPlanId,
          recipeId: recipe.recipeId,
          mealDate: newDate,
          mealType: recipe.mealType,
        };
      });

      await client.mealPlanRecipe.createMany({
        data: clonedRecipes,
      });
    }

    // Return new meal plan with recipes
    return client.mealPlan.findUnique({
      where: { mealPlanId: newMealPlan.mealPlanId },
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
    }) as Promise<MealPlanWithRecipes>;
  }
}
