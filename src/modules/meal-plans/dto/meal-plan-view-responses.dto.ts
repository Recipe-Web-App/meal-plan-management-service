import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MealPlanRecipeResponseDto } from './meal-plan-response.dto';

export class DayMealsDto {
  @ApiPropertyOptional({
    description: 'Breakfast meals',
    type: [MealPlanRecipeResponseDto],
  })
  @Expose()
  @Type(() => MealPlanRecipeResponseDto)
  breakfast?: MealPlanRecipeResponseDto[];

  @ApiPropertyOptional({
    description: 'Lunch meals',
    type: [MealPlanRecipeResponseDto],
  })
  @Expose()
  @Type(() => MealPlanRecipeResponseDto)
  lunch?: MealPlanRecipeResponseDto[];

  @ApiPropertyOptional({
    description: 'Dinner meals',
    type: [MealPlanRecipeResponseDto],
  })
  @Expose()
  @Type(() => MealPlanRecipeResponseDto)
  dinner?: MealPlanRecipeResponseDto[];

  @ApiPropertyOptional({
    description: 'Snack meals',
    type: [MealPlanRecipeResponseDto],
  })
  @Expose()
  @Type(() => MealPlanRecipeResponseDto)
  snack?: MealPlanRecipeResponseDto[];

  @ApiPropertyOptional({
    description: 'Dessert meals',
    type: [MealPlanRecipeResponseDto],
  })
  @Expose()
  @Type(() => MealPlanRecipeResponseDto)
  dessert?: MealPlanRecipeResponseDto[];
}

export class DayViewResponseDto {
  @ApiProperty({
    description: 'Meal plan ID',
    example: '123',
  })
  @Expose()
  mealPlanId!: string;

  @ApiProperty({
    description: 'Meal plan name',
    example: 'Weekly Family Meal Plan',
  })
  @Expose()
  mealPlanName!: string;

  @ApiProperty({
    description: 'Date for this day view',
    example: '2024-03-15',
    type: 'string',
    format: 'date',
  })
  @Expose()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({
    description: 'Meals organized by meal type',
    type: DayMealsDto,
  })
  @Expose()
  @Type(() => DayMealsDto)
  meals!: DayMealsDto;

  @ApiProperty({
    description: 'Total number of meals for this day',
    example: 5,
  })
  @Expose()
  totalMeals!: number;
}

export class WeekDayDto {
  @ApiProperty({
    description: 'Date for this day',
    example: '2024-03-15',
    type: 'string',
    format: 'date',
  })
  @Expose()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({
    description: 'Day of the week',
    example: 'Monday',
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  })
  @Expose()
  dayOfWeek!: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

  @ApiProperty({
    description: 'Meals for this day organized by meal type',
    type: DayMealsDto,
  })
  @Expose()
  @Type(() => DayMealsDto)
  meals!: DayMealsDto;

  @ApiProperty({
    description: 'Total number of meals for this day',
    example: 3,
  })
  @Expose()
  totalMeals!: number;
}

export class WeekViewResponseDto {
  @ApiProperty({
    description: 'Meal plan ID',
    example: '123',
  })
  @Expose()
  mealPlanId!: string;

  @ApiProperty({
    description: 'Meal plan name',
    example: 'Weekly Family Meal Plan',
  })
  @Expose()
  mealPlanName!: string;

  @ApiProperty({
    description: 'Start date of the week',
    example: '2024-03-11',
    type: 'string',
    format: 'date',
  })
  @Expose()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({
    description: 'End date of the week',
    example: '2024-03-17',
    type: 'string',
    format: 'date',
  })
  @Expose()
  @Type(() => Date)
  endDate!: Date;

  @ApiProperty({
    description: 'Week number in the year',
    example: 11,
  })
  @Expose()
  weekNumber!: number;

  @ApiProperty({
    description: 'Days in this week',
    type: [WeekDayDto],
  })
  @Expose()
  @Type(() => WeekDayDto)
  days!: WeekDayDto[];

  @ApiProperty({
    description: 'Total number of meals for the week',
    example: 21,
  })
  @Expose()
  totalMeals!: number;
}

export class MonthDayMealCountsDto {
  @ApiPropertyOptional({
    description: 'Number of breakfast meals',
    example: 1,
  })
  @Expose()
  breakfast?: number;

  @ApiPropertyOptional({
    description: 'Number of lunch meals',
    example: 1,
  })
  @Expose()
  lunch?: number;

  @ApiPropertyOptional({
    description: 'Number of dinner meals',
    example: 1,
  })
  @Expose()
  dinner?: number;

  @ApiPropertyOptional({
    description: 'Number of snack meals',
    example: 2,
  })
  @Expose()
  snack?: number;

  @ApiPropertyOptional({
    description: 'Number of dessert meals',
    example: 1,
  })
  @Expose()
  dessert?: number;
}

export class MonthDayDto {
  @ApiProperty({
    description: 'Date for this day',
    example: '2024-03-15',
    type: 'string',
    format: 'date',
  })
  @Expose()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({
    description: 'Day of the month',
    example: 15,
  })
  @Expose()
  dayOfMonth!: number;

  @ApiProperty({
    description: 'Whether this day belongs to the current month',
    example: true,
  })
  @Expose()
  isCurrentMonth!: boolean;

  @ApiProperty({
    description: 'Total number of meals for this day',
    example: 3,
  })
  @Expose()
  mealCount!: number;

  @ApiProperty({
    description: 'Meal counts by type',
    type: MonthDayMealCountsDto,
  })
  @Expose()
  @Type(() => MonthDayMealCountsDto)
  meals!: MonthDayMealCountsDto;
}

export class MonthWeekDto {
  @ApiProperty({
    description: 'Week number in the year',
    example: 11,
  })
  @Expose()
  weekNumber!: number;

  @ApiProperty({
    description: 'Start date of the week',
    example: '2024-03-11',
    type: 'string',
    format: 'date',
  })
  @Expose()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({
    description: 'End date of the week',
    example: '2024-03-17',
    type: 'string',
    format: 'date',
  })
  @Expose()
  @Type(() => Date)
  endDate!: Date;

  @ApiProperty({
    description: 'Days in this week',
    type: [MonthDayDto],
  })
  @Expose()
  @Type(() => MonthDayDto)
  days!: MonthDayDto[];
}

export class MonthViewResponseDto {
  @ApiProperty({
    description: 'Meal plan ID',
    example: '123',
  })
  @Expose()
  mealPlanId!: string;

  @ApiProperty({
    description: 'Meal plan name',
    example: 'Weekly Family Meal Plan',
  })
  @Expose()
  mealPlanName!: string;

  @ApiProperty({
    description: 'Year for this month view',
    example: 2024,
  })
  @Expose()
  year!: number;

  @ApiProperty({
    description: 'Month number (1-12)',
    example: 3,
  })
  @Expose()
  month!: number;

  @ApiProperty({
    description: 'Month name',
    example: 'March',
  })
  @Expose()
  monthName!: string;

  @ApiProperty({
    description: 'Weeks in this month',
    type: [MonthWeekDto],
  })
  @Expose()
  @Type(() => MonthWeekDto)
  weeks!: MonthWeekDto[];

  @ApiProperty({
    description: 'Total number of meals in the month',
    example: 93,
  })
  @Expose()
  totalMeals!: number;
}
