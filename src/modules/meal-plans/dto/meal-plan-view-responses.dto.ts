import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  ValidateNested,
  IsDate,
  IsIn,
  Min,
} from 'class-validator';
import { MealPlanRecipeResponseDto } from './meal-plan-response.dto';

export class DayMealsDto {
  @ApiPropertyOptional({
    description: 'Breakfast meals',
    type: [MealPlanRecipeResponseDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealPlanRecipeResponseDto)
  @Expose()
  breakfast?: MealPlanRecipeResponseDto[];

  @ApiPropertyOptional({
    description: 'Lunch meals',
    type: [MealPlanRecipeResponseDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealPlanRecipeResponseDto)
  @Expose()
  lunch?: MealPlanRecipeResponseDto[];

  @ApiPropertyOptional({
    description: 'Dinner meals',
    type: [MealPlanRecipeResponseDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealPlanRecipeResponseDto)
  @Expose()
  dinner?: MealPlanRecipeResponseDto[];

  @ApiPropertyOptional({
    description: 'Snack meals',
    type: [MealPlanRecipeResponseDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealPlanRecipeResponseDto)
  @Expose()
  snack?: MealPlanRecipeResponseDto[];

  @ApiPropertyOptional({
    description: 'Dessert meals',
    type: [MealPlanRecipeResponseDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealPlanRecipeResponseDto)
  @Expose()
  dessert?: MealPlanRecipeResponseDto[];
}

export class DayViewResponseDto {
  @ApiProperty({
    description: 'Meal plan ID',
    example: '123',
  })
  @IsString()
  @Expose()
  mealPlanId!: string;

  @ApiProperty({
    description: 'Meal plan name',
    example: 'Weekly Family Meal Plan',
  })
  @IsString()
  @Expose()
  mealPlanName!: string;

  @ApiProperty({
    description: 'Date for this day view',
    example: '2024-03-15',
    type: 'string',
    format: 'date',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  date!: Date;

  @ApiProperty({
    description: 'Meals organized by meal type',
    type: DayMealsDto,
  })
  @ValidateNested()
  @Type(() => DayMealsDto)
  @Expose()
  meals!: DayMealsDto;

  @ApiProperty({
    description: 'Total number of meals for this day',
    example: 5,
  })
  @IsNumber()
  @Min(0)
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
  @Type(() => Date)
  @IsDate()
  @Expose()
  date!: Date;

  @ApiProperty({
    description: 'Day of the week',
    example: 'Monday',
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  })
  @IsIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  @Expose()
  dayOfWeek!: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

  @ApiProperty({
    description: 'Meals for this day organized by meal type',
    type: DayMealsDto,
  })
  @ValidateNested()
  @Type(() => DayMealsDto)
  @Expose()
  meals!: DayMealsDto;

  @ApiProperty({
    description: 'Total number of meals for this day',
    example: 3,
  })
  @IsNumber()
  @Min(0)
  @Expose()
  totalMeals!: number;
}

export class WeekViewResponseDto {
  @ApiProperty({
    description: 'Meal plan ID',
    example: '123',
  })
  @IsString()
  @Expose()
  mealPlanId!: string;

  @ApiProperty({
    description: 'Meal plan name',
    example: 'Weekly Family Meal Plan',
  })
  @IsString()
  @Expose()
  mealPlanName!: string;

  @ApiProperty({
    description: 'Start date of the week',
    example: '2024-03-11',
    type: 'string',
    format: 'date',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  startDate!: Date;

  @ApiProperty({
    description: 'End date of the week',
    example: '2024-03-17',
    type: 'string',
    format: 'date',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  endDate!: Date;

  @ApiProperty({
    description: 'Week number in the year',
    example: 11,
  })
  @IsNumber()
  @Min(1)
  @Expose()
  weekNumber!: number;

  @ApiProperty({
    description: 'Days in this week',
    type: [WeekDayDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeekDayDto)
  @Expose()
  days!: WeekDayDto[];

  @ApiProperty({
    description: 'Total number of meals for the week',
    example: 21,
  })
  @IsNumber()
  @Min(0)
  @Expose()
  totalMeals!: number;
}

export class MonthDayMealCountsDto {
  @ApiPropertyOptional({
    description: 'Number of breakfast meals',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  breakfast?: number;

  @ApiPropertyOptional({
    description: 'Number of lunch meals',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  lunch?: number;

  @ApiPropertyOptional({
    description: 'Number of dinner meals',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  dinner?: number;

  @ApiPropertyOptional({
    description: 'Number of snack meals',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  snack?: number;

  @ApiPropertyOptional({
    description: 'Number of dessert meals',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
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
  @Type(() => Date)
  @IsDate()
  @Expose()
  date!: Date;

  @ApiProperty({
    description: 'Day of the month',
    example: 15,
  })
  @IsNumber()
  @Min(1)
  @Expose()
  dayOfMonth!: number;

  @ApiProperty({
    description: 'Whether this day is in the current month',
    example: true,
  })
  @IsBoolean()
  @Expose()
  isCurrentMonth!: boolean;

  @ApiProperty({
    description: 'Total meal count for this day',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  @Expose()
  mealCount!: number;

  @ApiProperty({
    description: 'Breakdown of meals by type',
    type: MonthDayMealCountsDto,
  })
  @ValidateNested()
  @Type(() => MonthDayMealCountsDto)
  @Expose()
  meals!: MonthDayMealCountsDto;
}

export class MonthWeekDto {
  @ApiProperty({
    description: 'Week number in the year',
    example: 11,
  })
  @IsNumber()
  @Min(1)
  @Expose()
  weekNumber!: number;

  @ApiProperty({
    description: 'Start date of the week',
    example: '2024-03-11',
    type: 'string',
    format: 'date',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  startDate!: Date;

  @ApiProperty({
    description: 'End date of the week',
    example: '2024-03-17',
    type: 'string',
    format: 'date',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  endDate!: Date;

  @ApiProperty({
    description: 'Days in this week',
    type: [MonthDayDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MonthDayDto)
  @Expose()
  days!: MonthDayDto[];
}

export class MonthViewResponseDto {
  @ApiProperty({
    description: 'Meal plan ID',
    example: '123',
  })
  @IsString()
  @Expose()
  mealPlanId!: string;

  @ApiProperty({
    description: 'Meal plan name',
    example: 'Monthly Family Meal Plan',
  })
  @IsString()
  @Expose()
  mealPlanName!: string;

  @ApiProperty({
    description: 'Year of the month view',
    example: 2024,
  })
  @IsNumber()
  @Min(2020)
  @Expose()
  year!: number;

  @ApiProperty({
    description: 'Month number (1-12)',
    example: 3,
  })
  @IsNumber()
  @Min(1)
  @Expose()
  month!: number;

  @ApiProperty({
    description: 'Month name',
    example: 'March',
  })
  @IsString()
  @Expose()
  monthName!: string;

  @ApiProperty({
    description: 'Weeks in this month',
    type: [MonthWeekDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MonthWeekDto)
  @Expose()
  weeks!: MonthWeekDto[];

  @ApiProperty({
    description: 'Total number of meals for the month',
    example: 93,
  })
  @IsNumber()
  @Min(0)
  @Expose()
  totalMeals!: number;
}
