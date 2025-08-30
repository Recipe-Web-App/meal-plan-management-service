import { IsString, IsNotEmpty, IsDate, IsBoolean, IsOptional, Length } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMealPlanDateRangeValid } from '../validators/date-range.validator';
import { NoMealPlanOverlap } from '../validators/meal-plan-overlap.validator';
import {
  StripHtml,
  NormalizeWhitespace,
} from '../validators/sanitizers/simple-sanitizer.validator';

export class CreateMealPlanDto {
  @ApiProperty({
    description: 'Name of the meal plan',
    example: 'Weekly Family Meal Plan',
    minLength: 1,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Meal plan name is required', groups: ['basic'] })
  @IsString({ message: 'Name must be a string', groups: ['basic'] })
  @Length(1, 100, { message: 'Name must be between 1 and 100 characters', groups: ['basic'] })
  @StripHtml()
  @NormalizeWhitespace()
  name!: string;

  @ApiPropertyOptional({
    description: 'Description of the meal plan',
    example: 'A healthy and balanced weekly meal plan for the family',
    maxLength: 500,
  })
  @IsOptional({ groups: ['basic'] })
  @IsString({ message: 'Description must be a string', groups: ['basic'] })
  @Length(0, 500, { message: 'Description cannot exceed 500 characters', groups: ['basic'] })
  @StripHtml()
  @NormalizeWhitespace()
  description?: string;

  @ApiProperty({
    description: 'Start date of the meal plan',
    example: '2025-08-29T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsNotEmpty({ message: 'Start date is required', groups: ['basic'] })
  @IsDate({ message: 'Start date must be a valid date', groups: ['basic'] })
  @IsMealPlanDateRangeValid()
  @NoMealPlanOverlap('userId')
  @Type(() => Date)
  @Transform(({ value }) => {
    // Check if Type decorator produced an Invalid Date
    if (value instanceof Date && isNaN(value.getTime())) {
      throw new Error('Invalid date format');
    }
    return value as Date;
  })
  startDate!: Date;

  @ApiProperty({
    description: 'End date of the meal plan',
    example: '2025-09-05T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  @IsNotEmpty({ message: 'End date is required', groups: ['basic'] })
  @IsDate({ message: 'End date must be a valid date', groups: ['basic'] })
  @Type(() => Date)
  @Transform(({ value }) => {
    // Check if Type decorator produced an Invalid Date
    if (value instanceof Date && isNaN(value.getTime())) {
      throw new Error('Invalid date format');
    }
    return value as Date;
  })
  endDate!: Date;

  @ApiPropertyOptional({
    description: 'Whether this meal plan is currently active',
    example: true,
    default: false,
  })
  @IsOptional({ groups: ['basic'] })
  @IsBoolean({ message: 'isActive must be a boolean', groups: ['basic'] })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
      return value as unknown as boolean; // Let validator handle invalid strings
    }
    return value as unknown as boolean;
  })
  isActive?: boolean = false;

  // Internal field for validation - set by service layer, not by client
  // This field is not exposed in API documentation
  userId?: string;
}
