import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@generated/prisma/client';
import { MealPlanFavoritesRepository } from './meal-plan-favorites.repository';
import {
  PaginationDto,
  MealPlanFavoriteResponseDto,
  MealPlanFavoriteCheckResponseDto,
  PaginatedMealPlanFavoritesResponseDto,
  MealPlanFavoriteApiResponseDto,
  MealPlanFavoriteCheckApiResponseDto,
  PaginationMetaDto,
  MealPlanResponseDto,
} from './dto';

export type FavoritesSortBy = 'favoritedAt' | 'mealPlanId';
export type SortOrder = 'asc' | 'desc';

@Injectable()
export class MealPlanFavoritesService {
  constructor(private readonly repository: MealPlanFavoritesRepository) {}

  /**
   * List user's favorite meal plans with pagination
   */
  async listFavorites(
    userId: string,
    paginationDto: PaginationDto,
    includeMealPlan: boolean = false,
    sortBy: FavoritesSortBy = 'favoritedAt',
    sortOrder: SortOrder = 'desc',
  ): Promise<PaginatedMealPlanFavoritesResponseDto> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.MealPlanFavoriteOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [favorites, total] = await Promise.all([
      this.repository.findByUser(userId, {
        skip,
        take: limit,
        orderBy,
        includeMealPlan,
      }),
      this.repository.countByUser(userId),
    ]);

    const totalPages = Math.ceil(total / limit);

    const data = favorites.map((favorite) => {
      const dto = plainToInstance(
        MealPlanFavoriteResponseDto,
        {
          mealPlanId: favorite.mealPlanId.toString(),
          userId: favorite.userId,
          favoritedAt: favorite.favoritedAt,
          ...(includeMealPlan &&
            'mealPlan' in favorite && {
              mealPlan: plainToInstance(
                MealPlanResponseDto,
                {
                  ...favorite.mealPlan,
                  id: favorite.mealPlan.mealPlanId.toString(),
                },
                { excludeExtraneousValues: true },
              ),
            }),
        },
        { excludeExtraneousValues: true },
      );
      return dto;
    });

    const meta = plainToInstance(
      PaginationMetaDto,
      {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      { excludeExtraneousValues: true },
    );

    return plainToInstance(
      PaginatedMealPlanFavoritesResponseDto,
      {
        success: true,
        data,
        meta,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Add a meal plan to user's favorites
   */
  async addFavorite(userId: string, mealPlanId: string): Promise<MealPlanFavoriteApiResponseDto> {
    const mealPlanIdBigInt = this.parseMealPlanId(mealPlanId);

    // Check if meal plan exists
    const mealPlanExists = await this.repository.mealPlanExists(mealPlanIdBigInt);
    if (!mealPlanExists) {
      throw new NotFoundException(`Meal plan with ID ${mealPlanId} not found`);
    }

    // Check if already favorited
    const existingFavorite = await this.repository.findByUserAndMealPlan(userId, mealPlanIdBigInt);
    if (existingFavorite) {
      throw new ConflictException(`Meal plan ${mealPlanId} is already in your favorites`);
    }

    // Create the favorite
    const favorite = await this.repository.create(userId, mealPlanIdBigInt);

    const data = plainToInstance(
      MealPlanFavoriteResponseDto,
      {
        mealPlanId: favorite.mealPlanId.toString(),
        userId: favorite.userId,
        favoritedAt: favorite.favoritedAt,
      },
      { excludeExtraneousValues: true },
    );

    return plainToInstance(
      MealPlanFavoriteApiResponseDto,
      {
        success: true,
        data,
        message: 'Meal plan added to favorites successfully',
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Check if a meal plan is in user's favorites
   */
  async checkFavorite(
    userId: string,
    mealPlanId: string,
  ): Promise<MealPlanFavoriteCheckApiResponseDto> {
    const mealPlanIdBigInt = this.parseMealPlanId(mealPlanId);

    const favorite = await this.repository.findByUserAndMealPlan(userId, mealPlanIdBigInt);

    const checkData = plainToInstance(
      MealPlanFavoriteCheckResponseDto,
      {
        isFavorited: !!favorite,
        favoritedAt: favorite?.favoritedAt ?? null,
      },
      { excludeExtraneousValues: true },
    );

    return plainToInstance(
      MealPlanFavoriteCheckApiResponseDto,
      {
        success: true,
        data: checkData,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Remove a meal plan from user's favorites
   */
  async removeFavorite(userId: string, mealPlanId: string): Promise<void> {
    const mealPlanIdBigInt = this.parseMealPlanId(mealPlanId);

    // Check if favorite exists
    const existingFavorite = await this.repository.findByUserAndMealPlan(userId, mealPlanIdBigInt);
    if (!existingFavorite) {
      throw new NotFoundException(`Meal plan ${mealPlanId} is not in your favorites`);
    }

    await this.repository.delete(userId, mealPlanIdBigInt);
  }

  /**
   * Parse meal plan ID from string to BigInt
   */
  private parseMealPlanId(id: string): bigint {
    try {
      return BigInt(id);
    } catch {
      throw new NotFoundException(`Invalid meal plan ID: ${id}`);
    }
  }
}
