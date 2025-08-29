import { IsString, IsOptional, IsBoolean, IsDate, IsUUID, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MealPlanQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value as boolean | undefined | null;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
      return value as boolean;
    }
    return value as boolean;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter meal plans starting from this date',
    example: '2025-08-29T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDate({ message: 'Start date from must be a valid date' })
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
  startDateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter meal plans ending before this date',
    example: '2025-12-31T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDate({ message: 'End date to must be a valid date' })
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
  endDateTo?: Date;

  @ApiPropertyOptional({
    description: 'Search in meal plan names (case-insensitive)',
    example: 'family',
  })
  @IsOptional()
  @IsString({ message: 'Name search must be a string' })
  nameSearch?: string;

  @ApiPropertyOptional({
    description: 'Search in meal plan descriptions (case-insensitive)',
    example: 'healthy',
  })
  @IsOptional()
  @IsString({ message: 'Description search must be a string' })
  descriptionSearch?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['name', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  @IsIn(['name', 'startDate', 'endDate', 'createdAt', 'updatedAt'], {
    message: 'Sort by must be one of: name, startDate, endDate, createdAt, updatedAt',
  })
  sortBy?: 'name' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  @IsIn(['asc', 'desc'], {
    message: 'Sort order must be either asc or desc',
  })
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Include recipes in the response',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Include recipes must be a boolean' })
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
  includeRecipes?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include archived meal plans',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Include archived must be a boolean' })
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
  includeArchived?: boolean = false;
}
