import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { MealPlan, MealPlanRecipe, MealType, Prisma } from '@generated/prisma/client';
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

export interface EnhancedMealPlanFilters {
  userId?: string;
  isActive?: boolean;
  startDateFrom?: Date;
  endDateTo?: Date;
  nameSearch?: string;
  descriptionSearch?: string;
  includeRecipes?: boolean;
  includeArchived?: boolean;
}

export interface MealPlanSorting {
  sortBy: 'name' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface RecipeFilters {
  mealType?: MealType;
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
}

export interface MealTypeCount {
  mealType: MealType;
  count: number;
}

export interface StatisticsData {
  totalRecipes: number;
  daysWithMeals: number;
  mealTypeCounts: MealTypeCount[];
  uniqueDates: Date[];
}

export interface MealPlanWithCounts extends MealPlan {
  _count: {
    mealPlanRecipes: number;
  };
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

  // New methods for enhanced filtering and querying

  async findManyWithFilters(
    filters: EnhancedMealPlanFilters,
    sorting: MealPlanSorting,
    pagination: { skip: number; take: number },
  ): Promise<MealPlan[]> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(sorting);

    return this.prisma.mealPlan.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
      ...(filters.includeRecipes && {
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
      }),
    });
  }

  async countMealPlans(filters: EnhancedMealPlanFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.mealPlan.count({ where });
  }

  async findByIdWithRecipesFiltered(
    mealPlanId: bigint,
    recipeFilters?: RecipeFilters,
  ): Promise<MealPlanWithRecipes | null> {
    const result = await this.prisma.mealPlan.findUnique({
      where: { mealPlanId },
      include: {
        mealPlanRecipes: {
          where: this.buildRecipeWhereClause(recipeFilters),
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

    return result as MealPlanWithRecipes | null;
  }

  private buildWhereClause(filters: EnhancedMealPlanFilters): Prisma.MealPlanWhereInput {
    const where: Prisma.MealPlanWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Note: isActive and includeArchived filtering not supported by current schema
    // These can be implemented if isActive field is added to MealPlan model

    // Date range filtering
    if (filters.startDateFrom || filters.endDateTo) {
      where.AND = [];

      if (filters.endDateTo) {
        where.AND.push({
          OR: [{ startDate: { lte: filters.endDateTo } }, { startDate: null }],
        });
      }

      if (filters.startDateFrom) {
        where.AND.push({
          OR: [{ endDate: { gte: filters.startDateFrom } }, { endDate: null }],
        });
      }
    }

    // Text search
    if (filters.nameSearch || filters.descriptionSearch) {
      const textFilters = [];

      if (filters.nameSearch) {
        textFilters.push({
          name: {
            contains: filters.nameSearch,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        });
      }

      if (filters.descriptionSearch) {
        textFilters.push({
          description: {
            contains: filters.descriptionSearch,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        });
      }

      where.OR = textFilters;
    }

    return where;
  }

  private buildOrderByClause(sorting: MealPlanSorting): Prisma.MealPlanOrderByWithRelationInput {
    const { sortBy, sortOrder } = sorting;
    return { [sortBy]: sortOrder };
  }

  private buildRecipeWhereClause(filters?: RecipeFilters): Prisma.MealPlanRecipeWhereInput {
    if (!filters) return {};

    const where: Prisma.MealPlanRecipeWhereInput = {};

    if (filters.mealType) {
      where.mealType = filters.mealType;
    }

    if (filters.dateRange) {
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        // If both dates are the same, filter for exact date
        if (filters.dateRange.startDate.getTime() === filters.dateRange.endDate.getTime()) {
          where.mealDate = filters.dateRange.startDate;
        } else {
          where.mealDate = {
            gte: filters.dateRange.startDate,
            lte: filters.dateRange.endDate,
          };
        }
      } else if (filters.dateRange.startDate) {
        where.mealDate = {
          gte: filters.dateRange.startDate,
        };
      } else if (filters.dateRange.endDate) {
        where.mealDate = {
          lte: filters.dateRange.endDate,
        };
      }
    }

    return where;
  }

  // Statistics & Analytics Methods

  async getMealPlanStatistics(mealPlanId: bigint): Promise<StatisticsData> {
    const [totalRecipes, mealTypeCounts, uniqueDatesResult] = await Promise.all([
      // Get total recipe count
      this.prisma.mealPlanRecipe.count({
        where: { mealPlanId },
      }),

      // Get counts by meal type
      this.prisma.mealPlanRecipe.groupBy({
        by: ['mealType'],
        where: { mealPlanId },
        _count: {
          mealType: true,
        },
      }),

      // Get unique dates
      this.prisma.mealPlanRecipe.findMany({
        where: { mealPlanId },
        select: { mealDate: true },
        distinct: ['mealDate'],
        orderBy: { mealDate: 'asc' },
      }),
    ]);

    const uniqueDates = uniqueDatesResult.map((r) => r.mealDate);
    const mealTypeCountsTyped: MealTypeCount[] = mealTypeCounts.map((item) => ({
      mealType: item.mealType,
      count: item._count.mealType,
    }));

    return {
      totalRecipes,
      daysWithMeals: uniqueDates.length,
      mealTypeCounts: mealTypeCountsTyped,
      uniqueDates,
    };
  }

  async getMealCountsByType(mealPlanId: bigint): Promise<MealTypeCount[]> {
    const counts = await this.prisma.mealPlanRecipe.groupBy({
      by: ['mealType'],
      where: { mealPlanId },
      _count: {
        mealType: true,
      },
    });

    return counts.map((item) => ({
      mealType: item.mealType,
      count: item._count.mealType,
    }));
  }

  async getUniqueMealDates(mealPlanId: bigint): Promise<Date[]> {
    const dates = await this.prisma.mealPlanRecipe.findMany({
      where: { mealPlanId },
      select: { mealDate: true },
      distinct: ['mealDate'],
      orderBy: { mealDate: 'asc' },
    });

    return dates.map((d) => d.mealDate);
  }

  // View Mode Support Methods

  async findRecipesForDateRange(
    mealPlanId: bigint,
    startDate: Date,
    endDate: Date,
    filters?: RecipeFilters,
  ): Promise<MealPlanRecipe[]> {
    const where: Prisma.MealPlanRecipeWhereInput = {
      mealPlanId,
      mealDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Apply additional filters
    if (filters?.mealType) {
      where.mealType = filters.mealType;
    }

    return this.prisma.mealPlanRecipe.findMany({
      where,
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

  async findRecipesForWeek(
    mealPlanId: bigint,
    weekStart: Date,
    filters?: RecipeFilters,
  ): Promise<MealPlanRecipe[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return this.findRecipesForDateRange(mealPlanId, weekStart, weekEnd, filters);
  }

  async findRecipesForMonth(
    mealPlanId: bigint,
    year: number,
    month: number,
    filters?: RecipeFilters,
  ): Promise<MealPlanRecipe[]> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return this.findRecipesForDateRange(mealPlanId, monthStart, monthEnd, filters);
  }

  // Enhanced Recipe Querying

  async findRecipesByMealType(mealPlanId: bigint, mealType: MealType): Promise<MealPlanRecipe[]> {
    return this.prisma.mealPlanRecipe.findMany({
      where: {
        mealPlanId,
        mealType,
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
      orderBy: [{ mealDate: 'asc' }],
    });
  }

  async findRecipesGroupedByMealType(
    mealPlanId: bigint,
    dateRange?: { startDate?: Date; endDate?: Date },
  ): Promise<Record<string, MealPlanRecipe[]>> {
    const where: Prisma.MealPlanRecipeWhereInput = { mealPlanId };

    if (dateRange) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (dateRange.startDate) dateFilter.gte = dateRange.startDate;
      if (dateRange.endDate) dateFilter.lte = dateRange.endDate;
      if (Object.keys(dateFilter).length > 0) {
        where.mealDate = dateFilter;
      }
    }

    const recipes = await this.prisma.mealPlanRecipe.findMany({
      where,
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

    // Group by meal type
    const grouped: Record<string, MealPlanRecipe[]> = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: [],
      SNACK: [],
      DESSERT: [],
    };

    recipes.forEach((recipe) => {
      const mealTypeKey = recipe.mealType as keyof typeof grouped;
      if (grouped[mealTypeKey]) {
        grouped[mealTypeKey].push(recipe);
      }
    });

    return grouped;
  }

  // Validation & Authorization Helpers

  async verifyMealPlanOwnership(mealPlanId: bigint, userId: string): Promise<boolean> {
    const count = await this.prisma.mealPlan.count({
      where: {
        mealPlanId,
        userId,
      },
    });
    return count > 0;
  }

  async checkMealPlanExists(mealPlanId: bigint): Promise<boolean> {
    const count = await this.prisma.mealPlan.count({
      where: { mealPlanId },
    });
    return count > 0;
  }

  // Performance Optimization Methods

  async findMealPlansWithCounts(
    filters: EnhancedMealPlanFilters,
    sorting: MealPlanSorting,
    pagination: { skip: number; take: number },
  ): Promise<MealPlanWithCounts[]> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(sorting);

    return this.prisma.mealPlan.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
      include: {
        _count: {
          select: {
            mealPlanRecipes: true,
          },
        },
        ...(filters.includeRecipes && {
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
        }),
      },
    }) as Promise<MealPlanWithCounts[]>;
  }

  async countRecipesByMealPlan(mealPlanId: bigint): Promise<number> {
    return this.prisma.mealPlanRecipe.count({
      where: { mealPlanId },
    });
  }
}
