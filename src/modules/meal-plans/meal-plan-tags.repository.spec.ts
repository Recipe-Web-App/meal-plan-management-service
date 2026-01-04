import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/config/database.config';
import { MealPlanTagsRepository } from './meal-plan-tags.repository';

describe('MealPlanTagsRepository', () => {
  let repository: MealPlanTagsRepository;
  let prisma: {
    mealPlanTag: {
      findMany: Mock<(...args: unknown[]) => unknown>;
      findUnique: Mock<(...args: unknown[]) => unknown>;
      count: Mock<(...args: unknown[]) => unknown>;
      createMany: Mock<(...args: unknown[]) => unknown>;
    };
    mealPlanTagJunction: {
      findMany: Mock<(...args: unknown[]) => unknown>;
      createMany: Mock<(...args: unknown[]) => unknown>;
      deleteMany: Mock<(...args: unknown[]) => unknown>;
      delete: Mock<(...args: unknown[]) => unknown>;
      count: Mock<(...args: unknown[]) => unknown>;
    };
    mealPlan: {
      findUnique: Mock<(...args: unknown[]) => unknown>;
      count: Mock<(...args: unknown[]) => unknown>;
    };
    $transaction: Mock<(...args: unknown[]) => unknown>;
  };

  const testMealPlanId = BigInt(123);
  const testTagId = BigInt(1);
  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const mockPrismaService = {
    mealPlanTag: {
      findMany: mock(() => {}),
      findUnique: mock(() => {}),
      count: mock(() => {}),
      createMany: mock(() => {}),
    },
    mealPlanTagJunction: {
      findMany: mock(() => {}),
      createMany: mock(() => {}),
      deleteMany: mock(() => {}),
      delete: mock(() => {}),
      count: mock(() => {}),
    },
    mealPlan: {
      findUnique: mock(() => {}),
      count: mock(() => {}),
    },
    $transaction: mock(() => {}),
  };

  beforeEach(async () => {
    mockPrismaService.mealPlanTag.findMany.mockReset();
    mockPrismaService.mealPlanTag.findUnique.mockReset();
    mockPrismaService.mealPlanTag.count.mockReset();
    mockPrismaService.mealPlanTag.createMany.mockReset();
    mockPrismaService.mealPlanTagJunction.findMany.mockReset();
    mockPrismaService.mealPlanTagJunction.createMany.mockReset();
    mockPrismaService.mealPlanTagJunction.deleteMany.mockReset();
    mockPrismaService.mealPlanTagJunction.delete.mockReset();
    mockPrismaService.mealPlanTagJunction.count.mockReset();
    mockPrismaService.mealPlan.findUnique.mockReset();
    mockPrismaService.mealPlan.count.mockReset();
    mockPrismaService.$transaction.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlanTagsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<MealPlanTagsRepository>(MealPlanTagsRepository);
    prisma = module.get(PrismaService);
  });

  describe('findAllTags', () => {
    it('should return paginated tags', async () => {
      const expectedTags = [
        { tagId: BigInt(1), name: 'Weekly' },
        { tagId: BigInt(2), name: 'Budget' },
      ];

      prisma.mealPlanTag.findMany.mockResolvedValue(expectedTags as never);

      const result = await repository.findAllTags({
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' },
      });

      expect(result).toEqual(expectedTags);
      expect(prisma.mealPlanTag.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' },
      });
    });

    it('should filter by name search', async () => {
      prisma.mealPlanTag.findMany.mockResolvedValue([] as never);

      await repository.findAllTags({
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' },
        nameSearch: 'Week',
      });

      expect(prisma.mealPlanTag.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'Week',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('countTags', () => {
    it('should return total count', async () => {
      prisma.mealPlanTag.count.mockResolvedValue(10 as never);

      const result = await repository.countTags();

      expect(result).toBe(10);
      expect(prisma.mealPlanTag.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should filter count by name search', async () => {
      prisma.mealPlanTag.count.mockResolvedValue(2 as never);

      const result = await repository.countTags('Diet');

      expect(result).toBe(2);
      expect(prisma.mealPlanTag.count).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'Diet',
            mode: 'insensitive',
          },
        },
      });
    });
  });

  describe('findTagsByMealPlanId', () => {
    it('should return tags for a meal plan', async () => {
      const junctions = [
        { mealPlanId: testMealPlanId, tagId: BigInt(1), tag: { tagId: BigInt(1), name: 'Weekly' } },
        { mealPlanId: testMealPlanId, tagId: BigInt(2), tag: { tagId: BigInt(2), name: 'Budget' } },
      ];

      prisma.mealPlanTagJunction.findMany.mockResolvedValue(junctions as never);

      const result = await repository.findTagsByMealPlanId(testMealPlanId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Weekly');
      expect(prisma.mealPlanTagJunction.findMany).toHaveBeenCalledWith({
        where: { mealPlanId: testMealPlanId },
        include: { tag: true },
      });
    });
  });

  describe('findOrCreateTagsByName', () => {
    it('should return existing tags', async () => {
      const existingTags = [
        { tagId: BigInt(1), name: 'Weekly' },
        { tagId: BigInt(2), name: 'Budget' },
      ];

      prisma.mealPlanTag.findMany
        .mockResolvedValueOnce(existingTags as never)
        .mockResolvedValueOnce(existingTags as never);

      const result = await repository.findOrCreateTagsByName(['Weekly', 'Budget']);

      expect(result).toEqual(existingTags);
      expect(prisma.mealPlanTag.createMany).not.toHaveBeenCalled();
    });

    it('should create new tags when they do not exist', async () => {
      const existingTags: unknown[] = [];
      const newTags = [
        { tagId: BigInt(1), name: 'NewTag1' },
        { tagId: BigInt(2), name: 'NewTag2' },
      ];

      prisma.mealPlanTag.findMany
        .mockResolvedValueOnce(existingTags as never)
        .mockResolvedValueOnce(newTags as never);
      prisma.mealPlanTag.createMany.mockResolvedValue({ count: 2 } as never);

      const result = await repository.findOrCreateTagsByName(['NewTag1', 'NewTag2']);

      expect(result).toEqual(newTags);
      expect(prisma.mealPlanTag.createMany).toHaveBeenCalledWith({
        data: [{ name: 'NewTag1' }, { name: 'NewTag2' }],
        skipDuplicates: true,
      });
    });

    it('should handle empty array', async () => {
      const result = await repository.findOrCreateTagsByName([]);

      expect(result).toEqual([]);
      expect(prisma.mealPlanTag.findMany).not.toHaveBeenCalled();
    });

    it('should trim and filter empty names', async () => {
      prisma.mealPlanTag.findMany
        .mockResolvedValueOnce([{ tagId: BigInt(1), name: 'ValidTag' }] as never)
        .mockResolvedValueOnce([{ tagId: BigInt(1), name: 'ValidTag' }] as never);

      await repository.findOrCreateTagsByName(['  ValidTag  ', '   ', '']);

      expect(prisma.mealPlanTag.findMany).toHaveBeenCalledWith({
        where: { name: { in: ['ValidTag'] } },
      });
    });
  });

  describe('addTagsToMealPlan', () => {
    it('should add tags to a meal plan', async () => {
      prisma.mealPlanTagJunction.createMany.mockResolvedValue({ count: 2 } as never);

      await repository.addTagsToMealPlan(testMealPlanId, [BigInt(1), BigInt(2)]);

      expect(prisma.mealPlanTagJunction.createMany).toHaveBeenCalledWith({
        data: [
          { mealPlanId: testMealPlanId, tagId: BigInt(1) },
          { mealPlanId: testMealPlanId, tagId: BigInt(2) },
        ],
        skipDuplicates: true,
      });
    });
  });

  describe('replaceTagsOnMealPlan', () => {
    it('should replace all tags in a transaction', async () => {
      prisma.$transaction.mockResolvedValue([{ count: 2 }, { count: 2 }] as never);

      await repository.replaceTagsOnMealPlan(testMealPlanId, [BigInt(3), BigInt(4)]);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('removeTagFromMealPlan', () => {
    it('should remove a tag from a meal plan', async () => {
      prisma.mealPlanTagJunction.delete.mockResolvedValue({} as never);

      await repository.removeTagFromMealPlan(testMealPlanId, testTagId);

      expect(prisma.mealPlanTagJunction.delete).toHaveBeenCalledWith({
        where: {
          mealPlanId_tagId: {
            mealPlanId: testMealPlanId,
            tagId: testTagId,
          },
        },
      });
    });
  });

  describe('mealPlanExists', () => {
    it('should return true when meal plan exists', async () => {
      prisma.mealPlan.count.mockResolvedValue(1 as never);

      const result = await repository.mealPlanExists(testMealPlanId);

      expect(result).toBe(true);
    });

    it('should return false when meal plan does not exist', async () => {
      prisma.mealPlan.count.mockResolvedValue(0 as never);

      const result = await repository.mealPlanExists(testMealPlanId);

      expect(result).toBe(false);
    });
  });

  describe('tagExistsOnMealPlan', () => {
    it('should return true when tag exists on meal plan', async () => {
      prisma.mealPlanTagJunction.count.mockResolvedValue(1 as never);

      const result = await repository.tagExistsOnMealPlan(testMealPlanId, testTagId);

      expect(result).toBe(true);
    });

    it('should return false when tag does not exist on meal plan', async () => {
      prisma.mealPlanTagJunction.count.mockResolvedValue(0 as never);

      const result = await repository.tagExistsOnMealPlan(testMealPlanId, testTagId);

      expect(result).toBe(false);
    });
  });

  describe('getMealPlanOwner', () => {
    it('should return user ID when meal plan exists', async () => {
      prisma.mealPlan.findUnique.mockResolvedValue({ userId: testUserId } as never);

      const result = await repository.getMealPlanOwner(testMealPlanId);

      expect(result).toBe(testUserId);
    });

    it('should return null when meal plan does not exist', async () => {
      prisma.mealPlan.findUnique.mockResolvedValue(null as never);

      const result = await repository.getMealPlanOwner(testMealPlanId);

      expect(result).toBeNull();
    });
  });

  describe('findTagById', () => {
    it('should return tag when found', async () => {
      const tag = { tagId: testTagId, name: 'Weekly' };
      prisma.mealPlanTag.findUnique.mockResolvedValue(tag as never);

      const result = await repository.findTagById(testTagId);

      expect(result).toEqual(tag);
      expect(prisma.mealPlanTag.findUnique).toHaveBeenCalledWith({
        where: { tagId: testTagId },
      });
    });

    it('should return null when tag not found', async () => {
      prisma.mealPlanTag.findUnique.mockResolvedValue(null as never);

      const result = await repository.findTagById(testTagId);

      expect(result).toBeNull();
    });
  });
});
