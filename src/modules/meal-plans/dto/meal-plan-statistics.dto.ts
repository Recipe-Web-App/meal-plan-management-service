import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class MealTypeBreakdownDto {
  @ApiPropertyOptional({
    description: 'Number of breakfast meals',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  breakfast?: number;

  @ApiPropertyOptional({
    description: 'Number of lunch meals',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  lunch?: number;

  @ApiPropertyOptional({
    description: 'Number of dinner meals',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  dinner?: number;

  @ApiPropertyOptional({
    description: 'Number of snack meals',
    example: 14,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  snack?: number;

  @ApiPropertyOptional({
    description: 'Number of dessert meals',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  dessert?: number;
}

export class MealPlanStatisticsDto {
  @ApiProperty({
    description: 'Total number of recipe instances in the meal plan',
    example: 38,
  })
  @IsNumber()
  @Min(0)
  @Expose()
  totalRecipes!: number;

  @ApiProperty({
    description: 'Total number of unique meal types',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  @Expose()
  totalMealTypes!: number;

  @ApiProperty({
    description: 'Average number of recipes per day',
    example: 5.4,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(0)
  @Expose()
  averageRecipesPerDay!: number;

  @ApiProperty({
    description: 'Breakdown of meal counts by meal type',
    type: MealTypeBreakdownDto,
  })
  @Type(() => MealTypeBreakdownDto)
  @Expose()
  mealTypeBreakdown!: MealTypeBreakdownDto;

  @ApiProperty({
    description: 'Start date of the meal plan',
    example: '2024-03-01',
  })
  @Type(() => Date)
  @Expose()
  startDate!: Date;

  @ApiProperty({
    description: 'End date of the meal plan',
    example: '2024-03-07',
  })
  @Type(() => Date)
  @Expose()
  endDate!: Date;

  @ApiProperty({
    description: 'Duration of the meal plan in days',
    example: 7,
  })
  @IsNumber()
  @Min(1)
  @Expose()
  duration!: number;
}
