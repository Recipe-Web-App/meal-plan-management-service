import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsEnum, IsDate, Min, Max } from 'class-validator';
import { MealType, MEAL_TYPE_VALUES } from '../enums/meal-type.enum';
import { MealPlanTagResponseDto } from './meal-plan-tag.dto';

export class MealPlanRecipeResponseDto {
  @ApiProperty({
    description: 'Meal plan recipe ID',
    example: '1',
  })
  @IsString()
  @Expose()
  mealPlanRecipeId!: string;

  @ApiProperty({
    description: 'Meal plan ID',
    example: '123',
  })
  @IsString()
  @Expose()
  mealPlanId!: string;

  @ApiProperty({
    description: 'Recipe ID',
    example: '456',
  })
  @IsString()
  @Expose()
  recipeId!: string;

  @ApiPropertyOptional({
    description: 'Recipe name (populated from recipe service)',
    example: 'Grilled Chicken Salad',
  })
  @IsOptional()
  @IsString()
  @Expose()
  recipeName?: string;

  @ApiPropertyOptional({
    description: 'Day number in the meal plan (1-7)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  @Expose()
  day?: number;

  @ApiPropertyOptional({
    description: 'Preparation time in minutes (from recipe)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  prepTime?: number;

  @ApiPropertyOptional({
    description: 'Cooking time in minutes (from recipe)',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  cookTime?: number;

  @ApiPropertyOptional({
    description: 'Recipe difficulty level (from recipe)',
    example: 'medium',
  })
  @IsOptional()
  @IsString()
  @Expose()
  difficulty?: string;

  @ApiProperty({
    description: 'Meal date',
    type: 'string',
    format: 'date',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  mealDate!: Date;

  @ApiProperty({
    description: 'Meal type',
    example: MealType.BREAKFAST,
    enum: MEAL_TYPE_VALUES,
  })
  @IsEnum(MealType)
  @Expose()
  mealType!: MealType;

  @ApiProperty({
    description: 'Number of servings',
    example: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @Expose()
  servings!: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Prepare the night before',
  })
  @IsOptional()
  @IsString()
  @Expose()
  notes?: string;

  @ApiProperty({
    description: 'Created at timestamp',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  updatedAt!: Date;
}

export class MealPlanResponseDto {
  @ApiProperty({
    description: 'Meal plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'User ID who owns this meal plan',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  userId!: string;

  @ApiProperty({
    description: 'Meal plan name',
    example: 'Weekly Family Meal Plan',
  })
  @Expose()
  name!: string;

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
  startDate!: Date;

  @ApiProperty({
    description: 'End date of the meal plan',
    example: '2025-09-05T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  endDate!: Date;

  @ApiProperty({
    description: 'Whether this meal plan is currently active',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    description: 'When the meal plan was created',
    example: '2025-08-29T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  createdAt!: Date;

  @ApiProperty({
    description: 'When the meal plan was last updated',
    example: '2025-08-29T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  updatedAt!: Date;

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

  @ApiPropertyOptional({
    description: 'Tags associated with this meal plan',
    type: [MealPlanTagResponseDto],
  })
  @Expose()
  @Type(() => MealPlanTagResponseDto)
  tags?: MealPlanTagResponseDto[];
}
