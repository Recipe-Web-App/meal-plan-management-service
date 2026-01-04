import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { MealPlanFavorite, MealPlan, Prisma } from '@generated/prisma/client';

export interface MealPlanFavoriteWithMealPlan extends MealPlanFavorite {
  mealPlan: MealPlan;
}

export interface FindFavoritesOptions {
  skip: number;
  take: number;
  orderBy: Prisma.MealPlanFavoriteOrderByWithRelationInput;
  includeMealPlan: boolean;
}

@Injectable()
export class MealPlanFavoritesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new meal plan favorite
   */
  async create(userId: string, mealPlanId: bigint): Promise<MealPlanFavorite> {
    return this.prisma.mealPlanFavorite.create({
      data: {
        userId,
        mealPlanId,
      },
    });
  }

  /**
   * Find a favorite by user and meal plan (composite key lookup)
   */
  async findByUserAndMealPlan(
    userId: string,
    mealPlanId: bigint,
  ): Promise<MealPlanFavorite | null> {
    return this.prisma.mealPlanFavorite.findUnique({
      where: {
        userId_mealPlanId: {
          userId,
          mealPlanId,
        },
      },
    });
  }

  /**
   * Find all favorites for a user with pagination and optional meal plan details
   */
  async findByUser(
    userId: string,
    options: FindFavoritesOptions,
  ): Promise<MealPlanFavorite[] | MealPlanFavoriteWithMealPlan[]> {
    return this.prisma.mealPlanFavorite.findMany({
      where: { userId },
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      ...(options.includeMealPlan && {
        include: {
          mealPlan: true,
        },
      }),
    });
  }

  /**
   * Count total favorites for a user
   */
  async countByUser(userId: string): Promise<number> {
    return this.prisma.mealPlanFavorite.count({
      where: { userId },
    });
  }

  /**
   * Delete a favorite
   */
  async delete(userId: string, mealPlanId: bigint): Promise<void> {
    await this.prisma.mealPlanFavorite.delete({
      where: {
        userId_mealPlanId: {
          userId,
          mealPlanId,
        },
      },
    });
  }

  /**
   * Check if a meal plan exists
   */
  async mealPlanExists(mealPlanId: bigint): Promise<boolean> {
    const count = await this.prisma.mealPlan.count({
      where: { mealPlanId },
    });
    return count > 0;
  }
}
