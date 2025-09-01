import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MealPlanResponseDto } from './meal-plan-response.dto';
import { MealPlanStatisticsDto } from './meal-plan-statistics.dto';
import {
  DayViewResponseDto,
  WeekViewResponseDto,
  MonthViewResponseDto,
} from './meal-plan-view-responses.dto';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  @Expose()
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  @Expose()
  limit!: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  @Expose()
  total!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  @Expose()
  totalPages!: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  @Expose()
  hasNext!: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  @Expose()
  hasPrevious!: boolean;
}

export class ApiResponseDto<T = unknown> {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiPropertyOptional({
    description: 'Response data',
  })
  @Expose()
  data?: T;

  @ApiPropertyOptional({
    description: 'Response message',
    example: 'Meal plan created successfully',
  })
  @Expose()
  message?: string;
}

export class PaginatedMealPlansResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'Array of meal plans',
    type: [MealPlanResponseDto],
  })
  @Expose()
  @Type(() => MealPlanResponseDto)
  data!: MealPlanResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}

export class MealPlanQueryResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'The view mode used for this response',
    enum: ['full', 'day', 'week', 'month'],
    example: 'full',
  })
  @Expose()
  viewMode!: 'full' | 'day' | 'week' | 'month';

  @ApiProperty({
    description: 'Response data based on view mode',
    oneOf: [
      { $ref: '#/components/schemas/MealPlanResponseDto' },
      { $ref: '#/components/schemas/DayViewResponseDto' },
      { $ref: '#/components/schemas/WeekViewResponseDto' },
      { $ref: '#/components/schemas/MonthViewResponseDto' },
    ],
  })
  @Expose()
  data!: MealPlanResponseDto | DayViewResponseDto | WeekViewResponseDto | MonthViewResponseDto;

  @ApiPropertyOptional({
    description: 'Optional statistics when includeStatistics=true',
    type: MealPlanStatisticsDto,
  })
  @Expose()
  @Type(() => MealPlanStatisticsDto)
  statistics?: MealPlanStatisticsDto;
}

export class SuccessResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Operation completed successfully',
  })
  @Expose()
  message!: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: false,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'Error information',
  })
  @Expose()
  error!: {
    message: string;
    code: string;
    details?: string[];
  };
}
