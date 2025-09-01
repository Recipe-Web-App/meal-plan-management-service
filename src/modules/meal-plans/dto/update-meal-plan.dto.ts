import { IsString, IsDate, IsOptional, Length } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMealPlanDateRangeValid } from '../validators/date-range.validator';
import { NoMealPlanOverlapOnUpdate } from '../validators/meal-plan-overlap.validator';
import {
  StripHtml,
  NormalizeWhitespace,
} from '../validators/sanitizers/simple-sanitizer.validator';

export class UpdateMealPlanDto {
  @ApiPropertyOptional({
    description: 'Name of the meal plan',
    example: 'Updated Weekly Family Meal Plan',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional({ groups: ['basic'] })
  @IsString({ message: 'Name must be a string', groups: ['basic'] })
  @Length(1, 255, { message: 'Name must be between 1 and 255 characters', groups: ['basic'] })
  @StripHtml()
  @NormalizeWhitespace()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the meal plan',
    example: 'An updated healthy and balanced weekly meal plan for the family',
    maxLength: 1000,
  })
  @IsOptional({ groups: ['basic'] })
  @IsString({ message: 'Description must be a string', groups: ['basic'] })
  @Length(0, 1000, { message: 'Description cannot exceed 1000 characters', groups: ['basic'] })
  @StripHtml()
  @NormalizeWhitespace()
  description?: string;

  @ApiPropertyOptional({
    description: 'Start date of the meal plan',
    example: '2025-08-29T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional({ groups: ['basic'] })
  @IsDate({ message: 'Start date must be a valid date', groups: ['basic'] })
  @IsMealPlanDateRangeValid()
  @NoMealPlanOverlapOnUpdate('userId', 'id')
  @Type(() => Date)
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value as Date | undefined | null;
    }
    // Check if Type decorator produced an Invalid Date
    if (value instanceof Date && isNaN(value.getTime())) {
      throw new Error('Invalid date format');
    }
    return value as Date;
  })
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date of the meal plan',
    example: '2025-09-05T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional({ groups: ['basic'] })
  @IsDate({ message: 'End date must be a valid date', groups: ['basic'] })
  @Type(() => Date)
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value as Date | undefined | null;
    }
    // Check if Type decorator produced an Invalid Date
    if (value instanceof Date && isNaN(value.getTime())) {
      throw new Error('Invalid date format');
    }
    return value as Date;
  })
  endDate?: Date;

  // Internal fields for validation - set by service layer, not by client
  // These fields are not exposed in API documentation
  userId?: string;
  id?: string;
}
