import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { MealPlan, MealPlanRecipe, MealType, Prisma } from '@prisma/client';

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

@Injectable()
export class MealPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMealPlanData): Promise<MealPlan> {
    return this.prisma.mealPlan.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
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
}
