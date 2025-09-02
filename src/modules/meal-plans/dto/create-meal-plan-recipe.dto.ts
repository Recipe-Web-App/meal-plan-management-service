import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MealType, MEAL_TYPE_VALUES } from '../enums/meal-type.enum';

export class CreateMealPlanRecipeDto {
  @ApiProperty({
    description: 'Recipe ID to add to the meal plan',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty({ message: 'Recipe ID is required' })
  @IsString({ message: 'Recipe ID must be a string' })
  @IsUUID(4, { message: 'Recipe ID must be a valid UUID' })
  recipeId!: string;

  @ApiProperty({
    description: 'Day of the meal plan (1-7 representing Monday-Sunday)',
    example: 1,
    minimum: 1,
    maximum: 7,
  })
  @IsNotEmpty({ message: 'Day is required' })
  @IsInt({ message: 'Day must be an integer' })
  @Min(1, { message: 'Day must be between 1 and 7' })
  @Max(7, { message: 'Day must be between 1 and 7' })
  @Type(() => Number)
  day!: number;

  @ApiProperty({
    description: 'Meal type for this recipe',
    example: MealType.BREAKFAST,
    enum: MEAL_TYPE_VALUES,
  })
  @IsNotEmpty({ message: 'Meal type is required' })
  @IsString({ message: 'Meal type must be a string' })
  @IsIn(MEAL_TYPE_VALUES, {
    message: `Meal type must be one of: ${MEAL_TYPE_VALUES.join(', ')}`,
  })
  mealType!: MealType;

  @ApiPropertyOptional({
    description: 'Number of servings for this recipe in the meal plan',
    example: 4,
    minimum: 1,
    maximum: 100,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Servings must be an integer' })
  @Min(1, { message: 'Servings must be at least 1' })
  @Max(100, { message: 'Servings cannot exceed 100' })
  @Type(() => Number)
  servings?: number = 1;

  @ApiPropertyOptional({
    description: 'Additional notes for this meal plan recipe',
    example: 'Prepare the night before for easier morning prep',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @Length(0, 500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
