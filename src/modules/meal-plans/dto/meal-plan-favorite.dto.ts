import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MealPlanResponseDto } from './meal-plan-response.dto';
import { PaginationMetaDto } from './api-responses.dto';

/**
 * Response DTO for a single meal plan favorite record.
 * Contains the favorite metadata and optionally the full meal plan details.
 */
export class MealPlanFavoriteResponseDto {
  @ApiProperty({
    description: 'Meal plan ID',
    example: '123',
  })
  @Expose()
  mealPlanId!: string;

  @ApiProperty({
    description: 'User ID who favorited the meal plan',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  userId!: string;

  @ApiProperty({
    description: 'When the meal plan was added to favorites',
    example: '2025-08-29T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  favoritedAt!: Date;

  @ApiPropertyOptional({
    description: 'Full meal plan details (included when includeMealPlan=true)',
    type: MealPlanResponseDto,
  })
  @Expose()
  @Type(() => MealPlanResponseDto)
  mealPlan?: MealPlanResponseDto;
}

/**
 * Response DTO for checking if a meal plan is favorited.
 * Returns a boolean status and the timestamp if favorited.
 */
export class MealPlanFavoriteCheckResponseDto {
  @ApiProperty({
    description: 'Whether the meal plan is favorited by the user',
    example: true,
  })
  @Expose()
  isFavorited!: boolean;

  @ApiPropertyOptional({
    description: 'When the meal plan was favorited (null if not favorited)',
    example: '2025-08-29T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  @Expose()
  @Type(() => Date)
  favoritedAt?: Date | null;
}

/**
 * Paginated response DTO for listing favorite meal plans.
 */
export class PaginatedMealPlanFavoritesResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'Array of favorite meal plans',
    type: [MealPlanFavoriteResponseDto],
  })
  @Expose()
  @Type(() => MealPlanFavoriteResponseDto)
  data!: MealPlanFavoriteResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}

/**
 * API response wrapper for single favorite operations (add/remove).
 */
export class MealPlanFavoriteApiResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'The favorite record',
    type: MealPlanFavoriteResponseDto,
  })
  @Expose()
  @Type(() => MealPlanFavoriteResponseDto)
  data!: MealPlanFavoriteResponseDto;

  @ApiPropertyOptional({
    description: 'Response message',
    example: 'Meal plan added to favorites successfully',
  })
  @Expose()
  message?: string;
}

/**
 * API response wrapper for checking favorite status.
 */
export class MealPlanFavoriteCheckApiResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'The favorite check result',
    type: MealPlanFavoriteCheckResponseDto,
  })
  @Expose()
  @Type(() => MealPlanFavoriteCheckResponseDto)
  data!: MealPlanFavoriteCheckResponseDto;
}
