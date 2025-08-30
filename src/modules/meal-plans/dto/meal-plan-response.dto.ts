import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class MealPlanRecipeResponseDto {
  @ApiProperty({
    description: 'Recipe ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  recipeId!: string;

  @ApiProperty({
    description: 'Recipe name',
    example: 'Overnight Oats with Berries',
  })
  @Expose()
  recipeName!: string;

  @ApiProperty({
    description: 'Day of the meal plan (1-7)',
    example: 1,
  })
  @Expose()
  day!: number;

  @ApiProperty({
    description: 'Meal type',
    example: 'breakfast',
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
  })
  @Expose()
  mealType!: 'breakfast' | 'lunch' | 'dinner' | 'snack';

  @ApiProperty({
    description: 'Number of servings',
    example: 4,
  })
  @Expose()
  servings: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Prepare the night before',
  })
  @Expose()
  notes?: string;

  @ApiProperty({
    description: 'Recipe preparation time in minutes',
    example: 15,
  })
  @Expose()
  prepTime?: number;

  @ApiProperty({
    description: 'Recipe cooking time in minutes',
    example: 0,
  })
  @Expose()
  cookTime?: number;

  @ApiProperty({
    description: 'Recipe difficulty level',
    example: 'easy',
    enum: ['easy', 'medium', 'hard'],
  })
  @Expose()
  difficulty?: 'easy' | 'medium' | 'hard';
}

export class MealPlanResponseDto {
  @ApiProperty({
    description: 'Meal plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User ID who owns this meal plan',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Meal plan name',
    example: 'Weekly Family Meal Plan',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Meal plan description',
    example: 'A healthy and balanced weekly meal plan for the family',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Start date of the meal plan',
    example: '2025-08-29T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    description: 'End date of the meal plan',
    example: '2025-09-05T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    description: 'Whether this meal plan is currently active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'When the meal plan was created',
    example: '2025-08-29T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'When the meal plan was last updated',
    example: '2025-08-29T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Recipes in this meal plan',
    type: [MealPlanRecipeResponseDto],
  })
  @Expose()
  @Type(() => MealPlanRecipeResponseDto)
  recipes?: MealPlanRecipeResponseDto[];

  @ApiPropertyOptional({
    description: 'Total number of recipes in the meal plan',
    example: 12,
  })
  @Expose()
  recipeCount?: number;

  @ApiPropertyOptional({
    description: 'Number of days covered by this meal plan',
    example: 7,
  })
  @Expose()
  durationDays?: number;
}
