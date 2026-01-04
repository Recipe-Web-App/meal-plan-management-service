import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { MealPlanTagsController } from './meal-plan-tags.controller';
import { MealPlanTagsService } from './meal-plan-tags.service';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/jwt-payload.interface';

describe('MealPlanTagsController', () => {
  let controller: MealPlanTagsController;
  let service: {
    listAllTags: Mock<(...args: unknown[]) => unknown>;
    getMealPlanTags: Mock<(...args: unknown[]) => unknown>;
    addTagsToMealPlan: Mock<(...args: unknown[]) => unknown>;
    replaceTagsOnMealPlan: Mock<(...args: unknown[]) => unknown>;
    removeTagFromMealPlan: Mock<(...args: unknown[]) => unknown>;
  };

  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const testMealPlanId = '123';
  const testTagId = '1';

  const mockUser: AuthenticatedUser = {
    id: testUserId,
    sub: testUserId,
    clientId: 'test-client',
    scopes: ['read', 'write'],
    exp: Date.now() + 3600000,
  };

  const mockService = {
    listAllTags: mock(() => {}),
    getMealPlanTags: mock(() => {}),
    addTagsToMealPlan: mock(() => {}),
    replaceTagsOnMealPlan: mock(() => {}),
    removeTagFromMealPlan: mock(() => {}),
  };

  beforeEach(async () => {
    mockService.listAllTags.mockReset();
    mockService.getMealPlanTags.mockReset();
    mockService.addTagsToMealPlan.mockReset();
    mockService.replaceTagsOnMealPlan.mockReset();
    mockService.removeTagFromMealPlan.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealPlanTagsController],
      providers: [
        {
          provide: MealPlanTagsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MealPlanTagsController>(MealPlanTagsController);
    service = module.get(MealPlanTagsService);
  });

  describe('listAllTags', () => {
    it('should call service with correct parameters', async () => {
      const expectedResponse = {
        success: true,
        data: [
          { tagId: '1', name: 'Weekly' },
          { tagId: '2', name: 'Budget' },
        ],
        meta: { page: 1, limit: 20, total: 2, totalPages: 1, hasNext: false, hasPrevious: false },
      };

      service.listAllTags.mockResolvedValue(expectedResponse as never);

      const result = await controller.listAllTags({ page: 1, limit: 20 }, 'Week', 'name', 'asc');

      expect(result).toEqual(expectedResponse);
      expect(service.listAllTags).toHaveBeenCalledWith(
        { page: 1, limit: 20 },
        'Week',
        'name',
        'asc',
      );
    });

    it('should use default sorting when not provided', async () => {
      const expectedResponse = {
        success: true,
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      };

      service.listAllTags.mockResolvedValue(expectedResponse as never);

      await controller.listAllTags({ page: 1, limit: 20 }, undefined, undefined, undefined);

      expect(service.listAllTags).toHaveBeenCalledWith(
        { page: 1, limit: 20 },
        undefined,
        'name',
        'asc',
      );
    });
  });

  describe('getMealPlanTags', () => {
    it('should call service with correct parameters', async () => {
      const expectedResponse = {
        success: true,
        data: [
          { tagId: '1', name: 'Weekly' },
          { tagId: '2', name: 'Budget' },
        ],
      };

      service.getMealPlanTags.mockResolvedValue(expectedResponse as never);

      const result = await controller.getMealPlanTags(testMealPlanId, mockUser);

      expect(result).toEqual(expectedResponse);
      expect(service.getMealPlanTags).toHaveBeenCalledWith(testUserId, testMealPlanId);
    });
  });

  describe('addTags', () => {
    it('should call service with correct parameters', async () => {
      const tagsDto = { tags: ['Weekly', 'Budget'] };
      const expectedResponse = {
        success: true,
        data: [
          { tagId: '1', name: 'Weekly' },
          { tagId: '2', name: 'Budget' },
        ],
        message: 'Tags added successfully',
      };

      service.addTagsToMealPlan.mockResolvedValue(expectedResponse as never);

      const result = await controller.addTags(testMealPlanId, tagsDto, mockUser);

      expect(result).toEqual(expectedResponse);
      expect(service.addTagsToMealPlan).toHaveBeenCalledWith(testUserId, testMealPlanId, tagsDto);
    });
  });

  describe('replaceTags', () => {
    it('should call service with correct parameters', async () => {
      const tagsDto = { tags: ['Monthly', 'Diet'] };
      const expectedResponse = {
        success: true,
        data: [
          { tagId: '3', name: 'Monthly' },
          { tagId: '4', name: 'Diet' },
        ],
        message: 'Tags replaced successfully',
      };

      service.replaceTagsOnMealPlan.mockResolvedValue(expectedResponse as never);

      const result = await controller.replaceTags(testMealPlanId, tagsDto, mockUser);

      expect(result).toEqual(expectedResponse);
      expect(service.replaceTagsOnMealPlan).toHaveBeenCalledWith(
        testUserId,
        testMealPlanId,
        tagsDto,
      );
    });
  });

  describe('removeTag', () => {
    it('should call service with correct parameters', async () => {
      service.removeTagFromMealPlan.mockResolvedValue(undefined as never);

      await controller.removeTag(testMealPlanId, testTagId, mockUser);

      expect(service.removeTagFromMealPlan).toHaveBeenCalledWith(
        testUserId,
        testMealPlanId,
        testTagId,
      );
    });
  });
});
