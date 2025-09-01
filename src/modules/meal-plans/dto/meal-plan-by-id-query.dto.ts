import { IsString, IsOptional, IsBoolean, IsDate, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MealType, MEAL_TYPE_VALUES } from '../enums/meal-type.enum';

export class MealPlanByIdQueryDto {
  @ApiPropertyOptional({
    description: 'How to structure the response data',
    example: 'full',
    enum: ['full', 'day', 'week', 'month'],
    default: 'full',
  })
  @IsOptional()
  @IsString({ message: 'View mode must be a string' })
  @IsIn(['full', 'day', 'week', 'month'], {
    message: 'View mode must be one of: full, day, week, month',
  })
  viewMode?: 'full' | 'day' | 'week' | 'month' = 'full';

  @ApiPropertyOptional({
    description: 'For "day" view - specific date to retrieve',
    example: '2024-03-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDate({ message: 'Filter date must be a valid date' })
  @Type(() => Date)
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value as Date | undefined | null;
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return date;
    }
    return value as Date;
  })
  filterDate?: Date;

  @ApiPropertyOptional({
    description: 'Start date for filtering (week view or custom range)',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDate({ message: 'Filter start date must be a valid date' })
  @Type(() => Date)
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value as Date | undefined | null;
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return date;
    }
    return value as Date;
  })
  filterStartDate?: Date;

  @ApiPropertyOptional({
    description: 'End date for custom date range filtering',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDate({ message: 'Filter end date must be a valid date' })
  @Type(() => Date)
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value as Date | undefined | null;
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return date;
    }
    return value as Date;
  })
  filterEndDate?: Date;

  @ApiPropertyOptional({
    description: 'Year for month view',
    example: 2024,
    minimum: 2020,
    maximum: 2100,
  })
  @IsOptional()
  @IsInt({ message: 'Filter year must be an integer' })
  @Min(2020, { message: 'Year must be between 2020 and 2100' })
  @Max(2100, { message: 'Year must be between 2020 and 2100' })
  @Type(() => Number)
  filterYear?: number;

  @ApiPropertyOptional({
    description: 'Month number (1-12) for month view',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt({ message: 'Filter month must be an integer' })
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  @Type(() => Number)
  filterMonth?: number;

  @ApiPropertyOptional({
    description: 'Filter results by meal type',
    enum: MEAL_TYPE_VALUES,
    example: MealType.BREAKFAST,
  })
  @IsOptional()
  @IsString({ message: 'Meal type must be a string' })
  @IsIn(MEAL_TYPE_VALUES, {
    message: `Meal type must be one of: ${MEAL_TYPE_VALUES.join(', ')}`,
  })
  mealType?: MealType;

  @ApiPropertyOptional({
    description: 'Group results by meal type',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Group by meal type must be a boolean' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
      return false;
    }
    return value as boolean;
  })
  groupByMealType?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include full recipe details in response',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Include recipes must be a boolean' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return true;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
      return true;
    }
    return value as boolean;
  })
  includeRecipes?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include meal statistics (useful for month view)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Include statistics must be a boolean' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
      return false;
    }
    return value as boolean;
  })
  includeStatistics?: boolean = false;
}
