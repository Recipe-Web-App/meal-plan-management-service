import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize, MaxLength } from 'class-validator';

/**
 * Pagination metadata DTO (defined locally to avoid circular imports).
 * Not exported to prevent conflict with the one in api-responses.dto.ts
 */
class PaginationMetaDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  @Expose()
  page!: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  @Expose()
  limit!: number;

  @ApiProperty({ description: 'Total number of items', example: 150 })
  @Expose()
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 8 })
  @Expose()
  totalPages!: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  @Expose()
  hasNext!: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  @Expose()
  hasPrevious!: boolean;
}

/**
 * Response DTO for a single meal plan tag.
 */
export class MealPlanTagResponseDto {
  @ApiProperty({
    description: 'Tag ID',
    example: '1',
  })
  @Expose()
  tagId!: string;

  @ApiProperty({
    description: 'Tag name',
    example: 'Weekly',
    maxLength: 50,
  })
  @Expose()
  name!: string;
}

/**
 * Request DTO for adding tags to a meal plan.
 * Accepts an array of tag names (creates new tags if they don't exist).
 */
export class AddMealPlanTagsDto {
  @ApiProperty({
    description: 'List of tag names to add',
    example: ['Weekly', 'Budget'],
    type: [String],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMinSize(1, { message: 'At least one tag is required' })
  @ArrayMaxSize(20, { message: 'Maximum 20 tags allowed' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @MaxLength(50, { each: true, message: 'Each tag name must be at most 50 characters' })
  tags!: string[];
}

/**
 * Paginated response DTO for listing all tags in the system.
 */
export class PaginatedTagsResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'Array of tags',
    type: [MealPlanTagResponseDto],
  })
  @Expose()
  @Type(() => MealPlanTagResponseDto)
  data!: MealPlanTagResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}

/**
 * API response wrapper for tag operations on a meal plan.
 */
export class MealPlanTagsApiResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'Array of tags on the meal plan',
    type: [MealPlanTagResponseDto],
  })
  @Expose()
  @Type(() => MealPlanTagResponseDto)
  data!: MealPlanTagResponseDto[];

  @ApiPropertyOptional({
    description: 'Response message',
    example: 'Tags updated successfully',
  })
  @Expose()
  message?: string;
}
