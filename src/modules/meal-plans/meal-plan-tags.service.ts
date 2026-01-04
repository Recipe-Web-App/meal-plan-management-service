import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@generated/prisma/client';
import { MealPlanTagsRepository } from './meal-plan-tags.repository';
import {
  PaginationDto,
  MealPlanTagResponseDto,
  PaginatedTagsResponseDto,
  MealPlanTagsApiResponseDto,
  AddMealPlanTagsDto,
  PaginationMetaDto,
} from './dto';

export type TagsSortBy = 'name' | 'tagId';
export type SortOrder = 'asc' | 'desc';

@Injectable()
export class MealPlanTagsService {
  constructor(private readonly repository: MealPlanTagsRepository) {}

  /**
   * List all tags in the system with pagination
   */
  async listAllTags(
    paginationDto: PaginationDto,
    nameSearch?: string,
    sortBy: TagsSortBy = 'name',
    sortOrder: SortOrder = 'asc',
  ): Promise<PaginatedTagsResponseDto> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.MealPlanTagOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const findOptions = {
      skip,
      take: limit,
      orderBy,
      ...(nameSearch && { nameSearch }),
    };

    const [tags, total] = await Promise.all([
      this.repository.findAllTags(findOptions),
      this.repository.countTags(nameSearch),
    ]);

    const totalPages = Math.ceil(total / limit);

    const data = tags.map((tag) =>
      plainToInstance(
        MealPlanTagResponseDto,
        {
          tagId: tag.tagId.toString(),
          name: tag.name,
        },
        { excludeExtraneousValues: true },
      ),
    );

    const meta = plainToInstance(
      PaginationMetaDto,
      {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      { excludeExtraneousValues: true },
    );

    return plainToInstance(
      PaginatedTagsResponseDto,
      {
        success: true,
        data,
        meta,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get tags for a specific meal plan
   */
  async getMealPlanTags(userId: string, mealPlanId: string): Promise<MealPlanTagsApiResponseDto> {
    const mealPlanIdBigInt = this.parseMealPlanId(mealPlanId);

    // Check meal plan exists and user owns it
    await this.verifyMealPlanOwnership(userId, mealPlanIdBigInt);

    const tags = await this.repository.findTagsByMealPlanId(mealPlanIdBigInt);

    const data = tags.map((tag) =>
      plainToInstance(
        MealPlanTagResponseDto,
        {
          tagId: tag.tagId.toString(),
          name: tag.name,
        },
        { excludeExtraneousValues: true },
      ),
    );

    return plainToInstance(
      MealPlanTagsApiResponseDto,
      {
        success: true,
        data,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Add tags to a meal plan (additive - keeps existing tags)
   */
  async addTagsToMealPlan(
    userId: string,
    mealPlanId: string,
    dto: AddMealPlanTagsDto,
  ): Promise<MealPlanTagsApiResponseDto> {
    const mealPlanIdBigInt = this.parseMealPlanId(mealPlanId);

    // Check meal plan exists and user owns it
    await this.verifyMealPlanOwnership(userId, mealPlanIdBigInt);

    // Find or create tags by name
    const tags = await this.repository.findOrCreateTagsByName(dto.tags);
    const tagIds = tags.map((tag) => tag.tagId);

    // Add tags to meal plan (duplicates are ignored)
    await this.repository.addTagsToMealPlan(mealPlanIdBigInt, tagIds);

    // Get all tags now on the meal plan
    const allTags = await this.repository.findTagsByMealPlanId(mealPlanIdBigInt);

    const data = allTags.map((tag) =>
      plainToInstance(
        MealPlanTagResponseDto,
        {
          tagId: tag.tagId.toString(),
          name: tag.name,
        },
        { excludeExtraneousValues: true },
      ),
    );

    return plainToInstance(
      MealPlanTagsApiResponseDto,
      {
        success: true,
        data,
        message: 'Tags added successfully',
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Replace all tags on a meal plan
   */
  async replaceTagsOnMealPlan(
    userId: string,
    mealPlanId: string,
    dto: AddMealPlanTagsDto,
  ): Promise<MealPlanTagsApiResponseDto> {
    const mealPlanIdBigInt = this.parseMealPlanId(mealPlanId);

    // Check meal plan exists and user owns it
    await this.verifyMealPlanOwnership(userId, mealPlanIdBigInt);

    // Find or create tags by name
    const tags = await this.repository.findOrCreateTagsByName(dto.tags);
    const tagIds = tags.map((tag) => tag.tagId);

    // Replace all tags on meal plan
    await this.repository.replaceTagsOnMealPlan(mealPlanIdBigInt, tagIds);

    // Get all tags now on the meal plan
    const allTags = await this.repository.findTagsByMealPlanId(mealPlanIdBigInt);

    const data = allTags.map((tag) =>
      plainToInstance(
        MealPlanTagResponseDto,
        {
          tagId: tag.tagId.toString(),
          name: tag.name,
        },
        { excludeExtraneousValues: true },
      ),
    );

    return plainToInstance(
      MealPlanTagsApiResponseDto,
      {
        success: true,
        data,
        message: 'Tags replaced successfully',
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Remove a single tag from a meal plan
   */
  async removeTagFromMealPlan(userId: string, mealPlanId: string, tagId: string): Promise<void> {
    const mealPlanIdBigInt = this.parseMealPlanId(mealPlanId);
    const tagIdBigInt = this.parseTagId(tagId);

    // Check meal plan exists and user owns it
    await this.verifyMealPlanOwnership(userId, mealPlanIdBigInt);

    // Check if tag exists on meal plan
    const tagExists = await this.repository.tagExistsOnMealPlan(mealPlanIdBigInt, tagIdBigInt);
    if (!tagExists) {
      throw new NotFoundException(
        `Tag with ID ${tagId} is not associated with meal plan ${mealPlanId}`,
      );
    }

    await this.repository.removeTagFromMealPlan(mealPlanIdBigInt, tagIdBigInt);
  }

  /**
   * Verify that a meal plan exists and the user owns it
   */
  private async verifyMealPlanOwnership(userId: string, mealPlanId: bigint): Promise<void> {
    const owner = await this.repository.getMealPlanOwner(mealPlanId);

    if (owner === null) {
      throw new NotFoundException(`Meal plan with ID ${mealPlanId.toString()} not found`);
    }

    if (owner !== userId) {
      throw new ForbiddenException('You do not have permission to modify tags on this meal plan');
    }
  }

  /**
   * Parse meal plan ID from string to BigInt
   */
  private parseMealPlanId(id: string): bigint {
    try {
      return BigInt(id);
    } catch {
      throw new NotFoundException(`Invalid meal plan ID: ${id}`);
    }
  }

  /**
   * Parse tag ID from string to BigInt
   */
  private parseTagId(id: string): bigint {
    try {
      return BigInt(id);
    } catch {
      throw new NotFoundException(`Invalid tag ID: ${id}`);
    }
  }
}
