import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { MealPlanTag, MealPlanTagJunction, Prisma } from '@generated/prisma/client';

export interface MealPlanTagWithJunction extends MealPlanTag {
  mealPlanTagJunctions?: MealPlanTagJunction[];
}

export interface FindTagsOptions {
  skip: number;
  take: number;
  orderBy: Prisma.MealPlanTagOrderByWithRelationInput;
  nameSearch?: string;
}

@Injectable()
export class MealPlanTagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all tags in the system with pagination and optional name search
   */
  async findAllTags(options: FindTagsOptions): Promise<MealPlanTag[]> {
    const where: Prisma.MealPlanTagWhereInput = {};
    if (options.nameSearch) {
      where.name = {
        contains: options.nameSearch,
        mode: 'insensitive',
      };
    }

    return this.prisma.mealPlanTag.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
    });
  }

  /**
   * Count total tags with optional name search filter
   */
  async countTags(nameSearch?: string): Promise<number> {
    const where: Prisma.MealPlanTagWhereInput = {};
    if (nameSearch) {
      where.name = {
        contains: nameSearch,
        mode: 'insensitive',
      };
    }

    return this.prisma.mealPlanTag.count({ where });
  }

  /**
   * Find all tags for a specific meal plan
   */
  async findTagsByMealPlanId(mealPlanId: bigint): Promise<MealPlanTag[]> {
    const junctions = await this.prisma.mealPlanTagJunction.findMany({
      where: { mealPlanId },
      include: { tag: true },
    });
    return junctions.map((junction) => junction.tag);
  }

  /**
   * Find or create tags by name.
   * Returns existing tags if found, creates new ones if not.
   */
  async findOrCreateTagsByName(names: string[]): Promise<MealPlanTag[]> {
    // Normalize tag names (trim whitespace)
    const normalizedNames = names.map((name) => name.trim()).filter((name) => name.length > 0);

    if (normalizedNames.length === 0) {
      return [];
    }

    // Find existing tags
    const existingTags = await this.prisma.mealPlanTag.findMany({
      where: {
        name: {
          in: normalizedNames,
        },
      },
    });

    const existingNames = new Set(existingTags.map((tag) => tag.name.toLowerCase()));
    const newNames = normalizedNames.filter((name) => !existingNames.has(name.toLowerCase()));

    // Create new tags if any
    if (newNames.length > 0) {
      await this.prisma.mealPlanTag.createMany({
        data: newNames.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }

    // Return all tags (existing + newly created)
    return this.prisma.mealPlanTag.findMany({
      where: {
        name: {
          in: normalizedNames,
        },
      },
    });
  }

  /**
   * Add tags to a meal plan (additive - keeps existing tags)
   */
  async addTagsToMealPlan(mealPlanId: bigint, tagIds: bigint[]): Promise<void> {
    await this.prisma.mealPlanTagJunction.createMany({
      data: tagIds.map((tagId) => ({
        mealPlanId,
        tagId,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Replace all tags on a meal plan (removes existing, adds new)
   */
  async replaceTagsOnMealPlan(mealPlanId: bigint, tagIds: bigint[]): Promise<void> {
    await this.prisma.$transaction([
      // Remove all existing tags
      this.prisma.mealPlanTagJunction.deleteMany({
        where: { mealPlanId },
      }),
      // Add new tags
      this.prisma.mealPlanTagJunction.createMany({
        data: tagIds.map((tagId) => ({
          mealPlanId,
          tagId,
        })),
      }),
    ]);
  }

  /**
   * Remove a single tag from a meal plan
   */
  async removeTagFromMealPlan(mealPlanId: bigint, tagId: bigint): Promise<void> {
    await this.prisma.mealPlanTagJunction.delete({
      where: {
        mealPlanId_tagId: {
          mealPlanId,
          tagId,
        },
      },
    });
  }

  /**
   * Check if a meal plan exists
   */
  async mealPlanExists(mealPlanId: bigint): Promise<boolean> {
    const count = await this.prisma.mealPlan.count({
      where: { mealPlanId },
    });
    return count > 0;
  }

  /**
   * Check if a tag exists on a meal plan
   */
  async tagExistsOnMealPlan(mealPlanId: bigint, tagId: bigint): Promise<boolean> {
    const count = await this.prisma.mealPlanTagJunction.count({
      where: {
        mealPlanId,
        tagId,
      },
    });
    return count > 0;
  }

  /**
   * Get meal plan owner for authorization check
   */
  async getMealPlanOwner(mealPlanId: bigint): Promise<string | null> {
    const mealPlan = await this.prisma.mealPlan.findUnique({
      where: { mealPlanId },
      select: { userId: true },
    });
    return mealPlan?.userId ?? null;
  }

  /**
   * Find a tag by ID
   */
  async findTagById(tagId: bigint): Promise<MealPlanTag | null> {
    return this.prisma.mealPlanTag.findUnique({
      where: { tagId },
    });
  }
}
