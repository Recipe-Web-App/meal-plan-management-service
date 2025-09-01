import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { MealType } from '../enums/meal-type.enum';

export class MealTypeBreakdownDto {
  @ApiProperty({
    description: 'Number of breakfast meals',
    example: 7,
  })
  @Expose()
  breakfast!: number;

  @ApiProperty({
    description: 'Number of lunch meals',
    example: 7,
  })
  @Expose()
  lunch!: number;

  @ApiProperty({
    description: 'Number of dinner meals',
    example: 7,
  })
  @Expose()
  dinner!: number;

  @ApiProperty({
    description: 'Number of snack meals',
    example: 14,
  })
  @Expose()
  snack!: number;

  @ApiProperty({
    description: 'Number of dessert meals',
    example: 3,
  })
  @Expose()
  dessert!: number;
}

export class MealPlanStatisticsDto {
  @ApiProperty({
    description: 'Average number of meals per day',
    example: 5.4,
    type: 'number',
    format: 'float',
  })
  @Expose()
  averageMealsPerDay!: number;

  @ApiProperty({
    description: 'Most frequent meal type in the plan',
    enum: Object.values(MealType),
    example: MealType.DINNER,
  })
  @Expose()
  mostFrequentMealType!: MealType;

  @ApiProperty({
    description: 'Number of days that have at least one meal',
    example: 7,
  })
  @Expose()
  daysWithMeals!: number;

  @ApiProperty({
    description: 'Total number of recipe instances in the meal plan',
    example: 38,
  })
  @Expose()
  totalRecipes!: number;

  @ApiProperty({
    description: 'Breakdown of meal counts by meal type',
    type: MealTypeBreakdownDto,
  })
  @Expose()
  mealTypeBreakdown!: MealTypeBreakdownDto;
}
