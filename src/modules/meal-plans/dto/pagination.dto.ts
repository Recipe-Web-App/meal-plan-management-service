import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    maximum: 1000,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Max(1000, { message: 'Page cannot exceed 1000' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Type(() => Number)
  limit?: number = 20;

  get offset(): number {
    return (this.page! - 1) * this.limit!;
  }
}

export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({
    description: 'The data items for this page',
    type: 'array',
  })
  data: T[];

  @ApiPropertyOptional({
    description: 'Pagination metadata',
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    const totalPages = Math.ceil(total / limit);

    this.meta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }
}
