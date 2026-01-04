import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MealPlanTagsService } from './meal-plan-tags.service';
import { MealPlanTagsRepository } from './meal-plan-tags.repository';

describe('MealPlanTagsService', () => {
  let service: MealPlanTagsService;
  let repository: {
    findAllTags: Mock<(...args: unknown[]) => unknown>;
    countTags: Mock<(...args: unknown[]) => unknown>;
    findTagsByMealPlanId: Mock<(...args: unknown[]) => unknown>;
    findOrCreateTagsByName: Mock<(...args: unknown[]) => unknown>;
    addTagsToMealPlan: Mock<(...args: unknown[]) => unknown>;
    replaceTagsOnMealPlan: Mock<(...args: unknown[]) => unknown>;
    removeTagFromMealPlan: Mock<(...args: unknown[]) => unknown>;
    tagExistsOnMealPlan: Mock<(...args: unknown[]) => unknown>;
    getMealPlanOwner: Mock<(...args: unknown[]) => unknown>;
  };

  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const testMealPlanId = '123';
  const testMealPlanIdBigInt = BigInt(123);
  const testTagId = '1';
  const testTagIdBigInt = BigInt(1);

  const mockRepository = {
    findAllTags: mock(() => {}),
    countTags: mock(() => {}),
    findTagsByMealPlanId: mock(() => {}),
    findOrCreateTagsByName: mock(() => {}),
    addTagsToMealPlan: mock(() => {}),
    replaceTagsOnMealPlan: mock(() => {}),
    removeTagFromMealPlan: mock(() => {}),
    tagExistsOnMealPlan: mock(() => {}),
    getMealPlanOwner: mock(() => {}),
  };

  beforeEach(async () => {
    mockRepository.findAllTags.mockReset();
    mockRepository.countTags.mockReset();
    mockRepository.findTagsByMealPlanId.mockReset();
    mockRepository.findOrCreateTagsByName.mockReset();
    mockRepository.addTagsToMealPlan.mockReset();
    mockRepository.replaceTagsOnMealPlan.mockReset();
    mockRepository.removeTagFromMealPlan.mockReset();
    mockRepository.tagExistsOnMealPlan.mockReset();
    mockRepository.getMealPlanOwner.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlanTagsService,
        {
          provide: MealPlanTagsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MealPlanTagsService>(MealPlanTagsService);
    repository = module.get(MealPlanTagsRepository);
  });

  describe('listAllTags', () => {
    it('should return paginated tags', async () => {
      const tags = [
        { tagId: BigInt(1), name: 'Weekly' },
        { tagId: BigInt(2), name: 'Budget' },
      ];

      repository.findAllTags.mockResolvedValue(tags as never);
      repository.countTags.mockResolvedValue(2 as never);

      const result = await service.listAllTags({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should handle empty results', async () => {
      repository.findAllTags.mockResolvedValue([] as never);
      repository.countTags.mockResolvedValue(0 as never);

      const result = await service.listAllTags({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should support name search filter', async () => {
      const tags = [{ tagId: BigInt(1), name: 'Weekly' }];

      repository.findAllTags.mockResolvedValue(tags as never);
      repository.countTags.mockResolvedValue(1 as never);

      const result = await service.listAllTags({ page: 1, limit: 20 }, 'Week');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(repository.findAllTags).toHaveBeenCalledWith(
        expect.objectContaining({ nameSearch: 'Week' }),
      );
    });

    it('should apply default pagination when not provided', async () => {
      repository.findAllTags.mockResolvedValue([] as never);
      repository.countTags.mockResolvedValue(0 as never);

      const result = await service.listAllTags({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('getMealPlanTags', () => {
    it('should return tags for a meal plan', async () => {
      const tags = [
        { tagId: BigInt(1), name: 'Weekly' },
        { tagId: BigInt(2), name: 'Budget' },
      ];

      repository.getMealPlanOwner.mockResolvedValue(testUserId as never);
      repository.findTagsByMealPlanId.mockResolvedValue(tags as never);

      const result = await service.getMealPlanTags(testUserId, testMealPlanId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Weekly');
    });

    it('should throw NotFoundException when meal plan does not exist', async () => {
      repository.getMealPlanOwner.mockResolvedValue(null as never);

      await expect(service.getMealPlanTags(testUserId, testMealPlanId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not own meal plan', async () => {
      repository.getMealPlanOwner.mockResolvedValue('other-user-id' as never);

      await expect(service.getMealPlanTags(testUserId, testMealPlanId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addTagsToMealPlan', () => {
    it('should add tags to a meal plan', async () => {
      const tagsToAdd = { tags: ['Weekly', 'Budget'] };
      const createdTags = [
        { tagId: BigInt(1), name: 'Weekly' },
        { tagId: BigInt(2), name: 'Budget' },
      ];

      repository.getMealPlanOwner.mockResolvedValue(testUserId as never);
      repository.findOrCreateTagsByName.mockResolvedValue(createdTags as never);
      repository.addTagsToMealPlan.mockResolvedValue(undefined as never);
      repository.findTagsByMealPlanId.mockResolvedValue(createdTags as never);

      const result = await service.addTagsToMealPlan(testUserId, testMealPlanId, tagsToAdd);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.message).toBe('Tags added successfully');
      expect(repository.addTagsToMealPlan).toHaveBeenCalledWith(testMealPlanIdBigInt, [
        BigInt(1),
        BigInt(2),
      ]);
    });

    it('should throw NotFoundException when meal plan does not exist', async () => {
      repository.getMealPlanOwner.mockResolvedValue(null as never);

      await expect(
        service.addTagsToMealPlan(testUserId, testMealPlanId, { tags: ['Test'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own meal plan', async () => {
      repository.getMealPlanOwner.mockResolvedValue('other-user-id' as never);

      await expect(
        service.addTagsToMealPlan(testUserId, testMealPlanId, { tags: ['Test'] }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('replaceTagsOnMealPlan', () => {
    it('should replace all tags on a meal plan', async () => {
      const newTags = { tags: ['Monthly', 'Diet'] };
      const replacedTags = [
        { tagId: BigInt(3), name: 'Monthly' },
        { tagId: BigInt(4), name: 'Diet' },
      ];

      repository.getMealPlanOwner.mockResolvedValue(testUserId as never);
      repository.findOrCreateTagsByName.mockResolvedValue(replacedTags as never);
      repository.replaceTagsOnMealPlan.mockResolvedValue(undefined as never);
      repository.findTagsByMealPlanId.mockResolvedValue(replacedTags as never);

      const result = await service.replaceTagsOnMealPlan(testUserId, testMealPlanId, newTags);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.message).toBe('Tags replaced successfully');
      expect(repository.replaceTagsOnMealPlan).toHaveBeenCalledWith(testMealPlanIdBigInt, [
        BigInt(3),
        BigInt(4),
      ]);
    });

    it('should throw NotFoundException when meal plan does not exist', async () => {
      repository.getMealPlanOwner.mockResolvedValue(null as never);

      await expect(
        service.replaceTagsOnMealPlan(testUserId, testMealPlanId, { tags: ['Test'] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeTagFromMealPlan', () => {
    it('should remove a tag from a meal plan', async () => {
      repository.getMealPlanOwner.mockResolvedValue(testUserId as never);
      repository.tagExistsOnMealPlan.mockResolvedValue(true as never);
      repository.removeTagFromMealPlan.mockResolvedValue(undefined as never);

      await expect(
        service.removeTagFromMealPlan(testUserId, testMealPlanId, testTagId),
      ).resolves.toBeUndefined();

      expect(repository.removeTagFromMealPlan).toHaveBeenCalledWith(
        testMealPlanIdBigInt,
        testTagIdBigInt,
      );
    });

    it('should throw NotFoundException when meal plan does not exist', async () => {
      repository.getMealPlanOwner.mockResolvedValue(null as never);

      await expect(
        service.removeTagFromMealPlan(testUserId, testMealPlanId, testTagId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own meal plan', async () => {
      repository.getMealPlanOwner.mockResolvedValue('other-user-id' as never);

      await expect(
        service.removeTagFromMealPlan(testUserId, testMealPlanId, testTagId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when tag is not on meal plan', async () => {
      repository.getMealPlanOwner.mockResolvedValue(testUserId as never);
      repository.tagExistsOnMealPlan.mockResolvedValue(false as never);

      await expect(
        service.removeTagFromMealPlan(testUserId, testMealPlanId, testTagId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('parseMealPlanId (via public methods)', () => {
    it('should throw NotFoundException for invalid meal plan ID', async () => {
      await expect(service.getMealPlanTags(testUserId, 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle valid BigInt string IDs', async () => {
      repository.getMealPlanOwner.mockResolvedValue(testUserId as never);
      repository.findTagsByMealPlanId.mockResolvedValue([] as never);

      const result = await service.getMealPlanTags(testUserId, '999999999999');

      expect(result.data).toHaveLength(0);
    });
  });

  describe('parseTagId (via removeTagFromMealPlan)', () => {
    it('should throw NotFoundException for invalid tag ID', async () => {
      repository.getMealPlanOwner.mockResolvedValue(testUserId as never);

      await expect(
        service.removeTagFromMealPlan(testUserId, testMealPlanId, 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
