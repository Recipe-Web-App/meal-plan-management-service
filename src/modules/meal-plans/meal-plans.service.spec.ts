import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MealPlansService } from './meal-plans.service';
import { MealPlansRepository } from './meal-plans.repository';
import { MealPlanTagsRepository } from './meal-plan-tags.repository';
import { MealPlanValidationService } from './services/meal-plan-validation.service';
import { MealPlanQueryDto, PaginationDto, MealPlanByIdQueryDto } from './dto';
import { MealType } from './enums/meal-type.enum';

describe('MealPlansService', () => {
  let service: MealPlansService;
  let repository: {
    findManyWithFilters: Mock<(...args: unknown[]) => unknown>;
    countMealPlans: Mock<(...args: unknown[]) => unknown>;
    findById: Mock<(...args: unknown[]) => unknown>;
    findByIdWithRecipesFiltered: Mock<(...args: unknown[]) => unknown>;
    verifyMealPlanOwnership: Mock<(...args: unknown[]) => unknown>;
    getMealPlanStatistics: Mock<(...args: unknown[]) => unknown>;
    checkMealPlanExists: Mock<(...args: unknown[]) => unknown>;
    findRecipesForDateRange: Mock<(...args: unknown[]) => unknown>;
    findRecipesForWeek: Mock<(...args: unknown[]) => unknown>;
    findRecipesForMonth: Mock<(...args: unknown[]) => unknown>;
    create: Mock<(...args: unknown[]) => unknown>;
    addRecipeToMealPlan: Mock<(...args: unknown[]) => unknown>;
    findByIdWithRecipes: Mock<(...args: unknown[]) => unknown>;
    update: Mock<(...args: unknown[]) => unknown>;
    delete: Mock<(...args: unknown[]) => unknown>;
  };

  const mockRepository = {
    findManyWithFilters: mock(() => {}),
    countMealPlans: mock(() => {}),
    findById: mock(() => {}),
    findByIdWithRecipesFiltered: mock(() => {}),
    verifyMealPlanOwnership: mock(() => {}),
    getMealPlanStatistics: mock(() => {}),
    checkMealPlanExists: mock(() => {}),
    findRecipesForDateRange: mock(() => {}),
    findRecipesForWeek: mock(() => {}),
    findRecipesForMonth: mock(() => {}),
    create: mock(() => {}),
    addRecipeToMealPlan: mock(() => {}),
    findByIdWithRecipes: mock(() => {}),
    update: mock(() => {}),
    delete: mock(() => {}),
  };

  const mockValidationService = {
    validateMealPlanAccess: mock(() => {}),
    validateCreateMealPlan: mock(() => {}),
    validateUpdateMealPlan: mock(() => {}),
  };

  const mockTagsRepository = {
    findTagsByMealPlanId: mock(() => {}),
    findOrCreateTagsByName: mock(() => {}),
    addTagsToMealPlan: mock(() => {}),
    replaceTagsOnMealPlan: mock(() => {}),
  };

  const mockMealPlan = {
    mealPlanId: BigInt(123),
    name: 'Test Meal Plan',
    description: 'Test Description',
    userId: 'test-user-id',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-03-07'),
    createdAt: new Date(),
    updatedAt: new Date(),
    mealPlanRecipes: [],
  };

  const mockMealPlanWithRecipes = {
    ...mockMealPlan,
    mealPlanRecipes: [
      {
        mealPlanId: BigInt(123),
        recipeId: BigInt(456),
        mealDate: new Date('2024-03-15'),
        mealType: MealType.BREAKFAST,
        recipe: {
          recipeId: BigInt(456),
          title: 'Test Recipe',
          userId: 'test-user-id',
        },
      },
    ],
  };

  beforeEach(async () => {
    // Reset all mocks
    mockRepository.findManyWithFilters.mockReset();
    mockRepository.countMealPlans.mockReset();
    mockRepository.findById.mockReset();
    mockRepository.findByIdWithRecipesFiltered.mockReset();
    mockRepository.verifyMealPlanOwnership.mockReset();
    mockRepository.getMealPlanStatistics.mockReset();
    mockRepository.checkMealPlanExists.mockReset();
    mockRepository.findRecipesForDateRange.mockReset();
    mockRepository.findRecipesForWeek.mockReset();
    mockRepository.findRecipesForMonth.mockReset();
    mockRepository.create.mockReset();
    mockRepository.addRecipeToMealPlan.mockReset();
    mockRepository.findByIdWithRecipes.mockReset();
    mockRepository.update.mockReset();
    mockRepository.delete.mockReset();
    mockValidationService.validateMealPlanAccess.mockReset();
    mockValidationService.validateCreateMealPlan.mockReset();
    mockValidationService.validateUpdateMealPlan.mockReset();
    mockTagsRepository.findTagsByMealPlanId.mockReset();
    mockTagsRepository.findOrCreateTagsByName.mockReset();
    mockTagsRepository.addTagsToMealPlan.mockReset();
    mockTagsRepository.replaceTagsOnMealPlan.mockReset();

    // Set default mock values for tags repository
    mockTagsRepository.findTagsByMealPlanId.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlansService,
        {
          provide: MealPlansRepository,
          useValue: mockRepository,
        },
        {
          provide: MealPlanValidationService,
          useValue: mockValidationService,
        },
        {
          provide: MealPlanTagsRepository,
          useValue: mockTagsRepository,
        },
      ],
    }).compile();

    service = module.get<MealPlansService>(MealPlansService);
    repository = module.get(MealPlansRepository);
  });

  describe('findMealPlans', () => {
    const queryDto: MealPlanQueryDto = {
      userId: 'test-user-id',
      isActive: true,
      includeRecipes: false,
    };

    const paginationDto: PaginationDto = {
      page: 1,
      limit: 20,
      offset: 0,
    };

    it('should return paginated meal plans', async () => {
      const mockMealPlans = [mockMealPlan];
      const totalCount = 1;

      repository.findManyWithFilters.mockResolvedValue(mockMealPlans);
      repository.countMealPlans.mockResolvedValue(totalCount);

      const result = await service.findMealPlans(queryDto, paginationDto, 'test-user-id');

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    });

    it('should handle empty results', async () => {
      repository.findManyWithFilters.mockResolvedValue([]);
      repository.countMealPlans.mockResolvedValue(0);

      const result = await service.findMealPlans(queryDto, paginationDto, 'test-user-id');

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('createMealPlan', () => {
    const userId = 'test-user-id';
    const createMealPlanDto = {
      name: 'Test Meal Plan',
      description: 'A test meal plan',
      startDate: new Date('2024-03-10'),
      endDate: new Date('2024-03-16'),
      recipes: [
        {
          recipeId: '456',
          day: 1,
          mealType: 'BREAKFAST',
          servings: 2,
        },
      ],
    };

    it('should create a meal plan successfully', async () => {
      const validationResult = {
        isValid: true,
        sanitizedData: {
          name: createMealPlanDto.name,
          description: createMealPlanDto.description,
          startDate: createMealPlanDto.startDate,
          endDate: createMealPlanDto.endDate,
        },
        errors: [],
      };

      mockValidationService.validateCreateMealPlan.mockResolvedValue(validationResult);
      mockRepository.create.mockResolvedValue(mockMealPlan);
      mockRepository.addRecipeToMealPlan.mockResolvedValue({
        mealPlanId: BigInt(123),
        recipeId: BigInt(456),
        mealDate: new Date('2024-03-10'),
        mealType: 'BREAKFAST',
      });
      mockRepository.findByIdWithRecipes.mockResolvedValue(mockMealPlanWithRecipes);

      const result = await service.createMealPlan(createMealPlanDto as any, userId);

      expect(mockValidationService.validateCreateMealPlan).toHaveBeenCalledWith(createMealPlanDto, {
        userId,
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        name: 'Test Meal Plan',
        description: 'A test meal plan',
        startDate: createMealPlanDto.startDate,
        endDate: createMealPlanDto.endDate,
      });
      expect(mockRepository.addRecipeToMealPlan).toHaveBeenCalledWith({
        mealPlanId: BigInt(123),
        recipeId: BigInt(456),
        mealDate: new Date('2024-03-01'), // Day 1 of the mock meal plan (starts 2024-03-01)
        mealType: 'BREAKFAST',
      });
      expect(result).toBeDefined();
    });

    it('should create a meal plan without recipes', async () => {
      const createMealPlanDtoWithoutRecipes = {
        name: 'Simple Meal Plan',
        description: 'No recipes',
        startDate: new Date('2024-03-10'),
        endDate: new Date('2024-03-16'),
      };

      const validationResult = {
        isValid: true,
        sanitizedData: createMealPlanDtoWithoutRecipes,
        errors: [],
      };

      mockValidationService.validateCreateMealPlan.mockResolvedValue(validationResult);
      mockRepository.create.mockResolvedValue(mockMealPlan);
      mockRepository.findByIdWithRecipes.mockResolvedValue(mockMealPlan);

      const result = await service.createMealPlan(createMealPlanDtoWithoutRecipes as any, userId);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.addRecipeToMealPlan).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when validation fails', async () => {
      const validationResult = {
        isValid: false,
        errors: ['Name is required'],
        sanitizedData: null,
      };

      mockValidationService.validateCreateMealPlan.mockResolvedValue(validationResult);

      await expect(service.createMealPlan(createMealPlanDto as any, userId)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when meal plan has no start date and recipes are provided', async () => {
      const invalidDto = {
        ...createMealPlanDto,
        startDate: null,
      };

      const validationResult = {
        isValid: true,
        sanitizedData: {
          name: invalidDto.name,
          description: invalidDto.description,
          startDate: null,
          endDate: invalidDto.endDate,
        },
        errors: [],
      };

      mockValidationService.validateCreateMealPlan.mockResolvedValue(validationResult);
      mockRepository.create.mockResolvedValue({
        ...mockMealPlan,
        startDate: null,
      });

      await expect(service.createMealPlan(invalidDto as any, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when day is outside meal plan range', async () => {
      const invalidDto = {
        ...createMealPlanDto,
        recipes: [
          {
            recipeId: '456',
            day: 10, // Outside 7-day range
            mealType: 'BREAKFAST',
          },
        ],
      };

      const validationResult = {
        isValid: true,
        sanitizedData: {
          name: invalidDto.name,
          description: invalidDto.description,
          startDate: invalidDto.startDate,
          endDate: invalidDto.endDate,
        },
        errors: [],
      };

      mockValidationService.validateCreateMealPlan.mockResolvedValue(validationResult);
      mockRepository.create.mockResolvedValue(mockMealPlan);

      await expect(service.createMealPlan(invalidDto as any, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle repository errors', async () => {
      const validationResult = {
        isValid: true,
        sanitizedData: {
          name: createMealPlanDto.name,
          description: createMealPlanDto.description,
          startDate: createMealPlanDto.startDate,
          endDate: createMealPlanDto.endDate,
        },
        errors: [],
      };

      mockValidationService.validateCreateMealPlan.mockResolvedValue(validationResult);
      mockRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createMealPlan(createMealPlanDto as any, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateMealPlan', () => {
    const mealPlanId = '123';
    const userId = 'test-user-id';

    const updateMealPlanDto = {
      name: 'Updated Meal Plan',
      description: 'Updated description',
      startDate: new Date('2024-04-01T00:00:00.000Z'),
      endDate: new Date('2024-04-07T23:59:59.999Z'),
    };

    const existingMealPlan = {
      mealPlanId: BigInt(123),
      name: 'Original Meal Plan',
      description: 'Original description',
      userId: 'test-user-id',
      startDate: new Date('2024-03-01T00:00:00.000Z'),
      endDate: new Date('2024-03-07T23:59:59.999Z'),
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
      updatedAt: new Date('2024-02-01T00:00:00.000Z'),
    };

    const updatedMealPlan = {
      ...existingMealPlan,
      name: 'Updated Meal Plan',
      description: 'Updated description',
      startDate: new Date('2024-04-01T00:00:00.000Z'),
      endDate: new Date('2024-04-07T23:59:59.999Z'),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockRepository.findById.mockReset();
      mockRepository.update.mockReset();
      mockValidationService.validateUpdateMealPlan.mockReset();
    });

    describe('successful updates', () => {
      it('should update a meal plan successfully with all fields', async () => {
        const validationResult = {
          isValid: true,
          sanitizedData: {
            name: 'Updated Meal Plan',
            description: 'Updated description',
            startDate: new Date('2024-04-01T00:00:00.000Z'),
            endDate: new Date('2024-04-07T23:59:59.999Z'),
          },
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockResolvedValue(updatedMealPlan);

        const result = await service.updateMealPlan(mealPlanId, updateMealPlanDto as any, userId);

        expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(123));
        expect(mockValidationService.validateUpdateMealPlan).toHaveBeenCalledWith(
          { ...updateMealPlanDto, userId, id: mealPlanId },
          { userId, currentMealPlanId: mealPlanId },
        );
        expect(mockRepository.update).toHaveBeenCalledWith(BigInt(123), {
          name: 'Updated Meal Plan',
          description: 'Updated description',
          startDate: new Date('2024-04-01T00:00:00.000Z'),
          endDate: new Date('2024-04-07T23:59:59.999Z'),
        });
        expect(result).toBeDefined();
        expect(result.name).toBe('Updated Meal Plan');
      });

      it('should update a meal plan with partial fields', async () => {
        const partialUpdateDto = {
          name: 'Just Update Name',
        };

        const validationResult = {
          isValid: true,
          sanitizedData: {
            name: 'Just Update Name',
          },
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockResolvedValue({
          ...existingMealPlan,
          name: 'Just Update Name',
        });

        const result = await service.updateMealPlan(mealPlanId, partialUpdateDto as any, userId);

        expect(mockRepository.update).toHaveBeenCalledWith(BigInt(123), {
          name: 'Just Update Name',
        });
        expect(result.name).toBe('Just Update Name');
      });

      it('should handle empty update (no fields changed)', async () => {
        const emptyUpdateDto = {};

        const validationResult = {
          isValid: true,
          sanitizedData: {},
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);

        const result = await service.updateMealPlan(mealPlanId, emptyUpdateDto as any, userId);

        expect(mockRepository.update).not.toHaveBeenCalled();
        expect(result).toBeDefined();
        expect(result.name).toBe('Original Meal Plan');
      });

      it('should update only name field', async () => {
        const nameOnlyDto = { name: 'New Name' };
        const validationResult = {
          isValid: true,
          sanitizedData: { name: 'New Name' },
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockResolvedValue({
          ...existingMealPlan,
          name: 'New Name',
        });

        await service.updateMealPlan(mealPlanId, nameOnlyDto as any, userId);

        expect(mockRepository.update).toHaveBeenCalledWith(BigInt(123), {
          name: 'New Name',
        });
      });

      it('should update only description field', async () => {
        const descOnlyDto = { description: 'New description' };
        const validationResult = {
          isValid: true,
          sanitizedData: { description: 'New description' },
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockResolvedValue({
          ...existingMealPlan,
          description: 'New description',
        });

        await service.updateMealPlan(mealPlanId, descOnlyDto as any, userId);

        expect(mockRepository.update).toHaveBeenCalledWith(BigInt(123), {
          description: 'New description',
        });
      });

      it('should update date fields only', async () => {
        const dateOnlyDto = {
          startDate: new Date('2024-05-01T00:00:00.000Z'),
          endDate: new Date('2024-05-07T23:59:59.999Z'),
        };

        const validationResult = {
          isValid: true,
          sanitizedData: {
            startDate: new Date('2024-05-01T00:00:00.000Z'),
            endDate: new Date('2024-05-07T23:59:59.999Z'),
          },
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockResolvedValue({
          ...existingMealPlan,
          startDate: new Date('2024-05-01T00:00:00.000Z'),
          endDate: new Date('2024-05-07T23:59:59.999Z'),
        });

        await service.updateMealPlan(mealPlanId, dateOnlyDto as any, userId);

        expect(mockRepository.update).toHaveBeenCalledWith(BigInt(123), {
          startDate: new Date('2024-05-01T00:00:00.000Z'),
          endDate: new Date('2024-05-07T23:59:59.999Z'),
        });
      });
    });

    describe('error handling', () => {
      it('should throw NotFoundException when meal plan does not exist', async () => {
        mockRepository.findById.mockResolvedValue(null);

        await expect(
          service.updateMealPlan(mealPlanId, updateMealPlanDto as any, userId),
        ).rejects.toThrow(NotFoundException);

        expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(123));
      });

      it('should throw ForbiddenException when user does not own meal plan', async () => {
        const differentUserMealPlan = {
          ...existingMealPlan,
          userId: 'different-user-id',
        };

        mockRepository.findById.mockResolvedValue(differentUserMealPlan);

        await expect(
          service.updateMealPlan(mealPlanId, updateMealPlanDto as any, userId),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw BadRequestException when validation fails', async () => {
        const validationResult = {
          isValid: false,
          errors: ['Name is required', 'Invalid date range'],
          sanitizedData: undefined,
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);

        await expect(
          service.updateMealPlan(mealPlanId, updateMealPlanDto as any, userId),
        ).rejects.toThrow(BadRequestException);
      });

      it('should handle repository update errors', async () => {
        const validationResult = {
          isValid: true,
          sanitizedData: updateMealPlanDto,
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockRejectedValue(new Error('Database error'));

        await expect(
          service.updateMealPlan(mealPlanId, updateMealPlanDto as any, userId),
        ).rejects.toThrow(BadRequestException);
      });

      it('should propagate NotFoundException from nested methods', async () => {
        const validationResult = {
          isValid: true,
          sanitizedData: updateMealPlanDto,
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockRejectedValue(new NotFoundException('Record not found'));

        await expect(
          service.updateMealPlan(mealPlanId, updateMealPlanDto as any, userId),
        ).rejects.toThrow(NotFoundException);
      });

      it('should propagate ForbiddenException from nested methods', async () => {
        const validationResult = {
          isValid: true,
          sanitizedData: updateMealPlanDto,
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockRejectedValue(new ForbiddenException('Access denied'));

        await expect(
          service.updateMealPlan(mealPlanId, updateMealPlanDto as any, userId),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should propagate BadRequestException from nested methods', async () => {
        const validationResult = {
          isValid: true,
          sanitizedData: updateMealPlanDto,
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockRejectedValue(new BadRequestException('Invalid data'));

        await expect(
          service.updateMealPlan(mealPlanId, updateMealPlanDto as any, userId),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('validation context', () => {
      it('should set correct validation context', async () => {
        const validationResult = {
          isValid: true,
          sanitizedData: { name: 'Test' },
          errors: [],
        };

        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockValidationService.validateUpdateMealPlan.mockResolvedValue(validationResult);
        mockRepository.update.mockResolvedValue(existingMealPlan);

        await service.updateMealPlan(mealPlanId, { name: 'Test' } as any, userId);

        expect(mockValidationService.validateUpdateMealPlan).toHaveBeenCalledWith(
          { name: 'Test', userId, id: mealPlanId },
          { userId, currentMealPlanId: mealPlanId },
        );
      });
    });
  });

  describe('deleteMealPlan', () => {
    const mealPlanId = '123';
    const userId = 'test-user-id';

    const existingMealPlan = {
      mealPlanId: BigInt(123),
      name: 'Test Meal Plan',
      description: 'Test description',
      userId: 'test-user-id',
      startDate: new Date('2024-03-01T00:00:00.000Z'),
      endDate: new Date('2024-03-07T23:59:59.999Z'),
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
      updatedAt: new Date('2024-02-01T00:00:00.000Z'),
    };

    beforeEach(() => {
      mockRepository.findById.mockReset();
      mockRepository.delete.mockReset();
    });

    describe('successful deletion', () => {
      it('should delete a meal plan successfully', async () => {
        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockRepository.delete.mockResolvedValue(existingMealPlan);

        await service.deleteMealPlan(mealPlanId, userId);

        expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(123));
        expect(mockRepository.delete).toHaveBeenCalledWith(BigInt(123));
      });

      it('should verify ownership before deletion', async () => {
        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockRepository.delete.mockResolvedValue(existingMealPlan);

        await service.deleteMealPlan(mealPlanId, userId);

        // Should call both findById (for ownership verification) and delete
        expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(123));
        expect(mockRepository.delete).toHaveBeenCalledWith(BigInt(123));
      });

      it('should handle different meal plan ID formats', async () => {
        const testIds = ['1', '456', '999999'];

        for (const testId of testIds) {
          mockRepository.findById.mockReset();
          mockRepository.delete.mockReset();

          const mealPlan = { ...existingMealPlan, mealPlanId: BigInt(testId) };
          mockRepository.findById.mockResolvedValue(mealPlan);
          mockRepository.delete.mockResolvedValue(mealPlan);

          await service.deleteMealPlan(testId, userId);

          expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(testId));
          expect(mockRepository.delete).toHaveBeenCalledWith(BigInt(testId));
        }
      });
    });

    describe('error handling', () => {
      it('should throw NotFoundException when meal plan does not exist', async () => {
        mockRepository.findById.mockResolvedValue(null);

        await expect(service.deleteMealPlan(mealPlanId, userId)).rejects.toThrow(NotFoundException);

        expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(123));
        expect(mockRepository.delete).not.toHaveBeenCalled();
      });

      it('should throw ForbiddenException when user does not own meal plan', async () => {
        const differentUserMealPlan = {
          ...existingMealPlan,
          userId: 'different-user-id',
        };

        mockRepository.findById.mockResolvedValue(differentUserMealPlan);

        await expect(service.deleteMealPlan(mealPlanId, userId)).rejects.toThrow(
          ForbiddenException,
        );

        expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(123));
        expect(mockRepository.delete).not.toHaveBeenCalled();
      });

      it('should handle repository delete errors', async () => {
        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockRepository.delete.mockRejectedValue(new Error('Database error'));

        await expect(service.deleteMealPlan(mealPlanId, userId)).rejects.toThrow(
          BadRequestException,
        );

        expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(123));
        expect(mockRepository.delete).toHaveBeenCalledWith(BigInt(123));
      });

      it('should propagate NotFoundException from repository operations', async () => {
        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockRepository.delete.mockRejectedValue(
          new NotFoundException('Record not found during deletion'),
        );

        await expect(service.deleteMealPlan(mealPlanId, userId)).rejects.toThrow(NotFoundException);
      });

      it('should propagate ForbiddenException from repository operations', async () => {
        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockRepository.delete.mockRejectedValue(
          new ForbiddenException('Access denied during deletion'),
        );

        await expect(service.deleteMealPlan(mealPlanId, userId)).rejects.toThrow(
          ForbiddenException,
        );
      });

      it('should wrap generic errors in BadRequestException', async () => {
        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockRepository.delete.mockRejectedValue(new Error('Generic database error'));

        await expect(service.deleteMealPlan(mealPlanId, userId)).rejects.toThrow(
          BadRequestException,
        );

        const thrownError = await service.deleteMealPlan(mealPlanId, userId).catch((err) => err);
        expect(thrownError.message).toBe('Failed to delete meal plan');
      });
    });

    describe('authorization checks', () => {
      it('should verify user ownership with exact userId match', async () => {
        const testUserId = 'specific-user-123';
        const ownedMealPlan = {
          ...existingMealPlan,
          userId: testUserId,
        };

        mockRepository.findById.mockResolvedValue(ownedMealPlan);
        mockRepository.delete.mockResolvedValue(ownedMealPlan);

        await service.deleteMealPlan(mealPlanId, testUserId);

        expect(mockRepository.delete).toHaveBeenCalled();
      });

      it('should reject deletion when userId does not match exactly', async () => {
        const mealPlanOwnerId = 'owner-123';
        const requestUserId = 'different-456';

        const mealPlan = {
          ...existingMealPlan,
          userId: mealPlanOwnerId,
        };

        mockRepository.findById.mockResolvedValue(mealPlan);

        await expect(service.deleteMealPlan(mealPlanId, requestUserId)).rejects.toThrow(
          ForbiddenException,
        );

        expect(mockRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('cascade deletion', () => {
      it('should rely on Prisma cascade deletion for recipes', async () => {
        // This test verifies that we don't manually delete recipes
        // but rely on Prisma's cascade deletion
        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockRepository.delete.mockResolvedValue(existingMealPlan);

        await service.deleteMealPlan(mealPlanId, userId);

        // Should only call repository.delete, not any recipe removal methods
        expect(mockRepository.delete).toHaveBeenCalledWith(BigInt(123));
        // Verify that only the delete method was called for cascade deletion
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      });
    });

    describe('return value', () => {
      it('should not return any value (void)', async () => {
        mockRepository.findById.mockResolvedValue(existingMealPlan);
        mockRepository.delete.mockResolvedValue(existingMealPlan);

        const result = await service.deleteMealPlan(mealPlanId, userId);

        expect(result).toBeUndefined();
      });
    });
  });

  describe('findMealPlanById', () => {
    const queryDto: MealPlanByIdQueryDto = {
      viewMode: 'full',
      includeRecipes: true,
    };

    it('should return meal plan by id', async () => {
      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findByIdWithRecipesFiltered.mockResolvedValue(mockMealPlanWithRecipes);

      const result = await service.findMealPlanById('123', queryDto, 'test-user-id');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when meal plan not found', async () => {
      repository.checkMealPlanExists.mockResolvedValue(false);

      await expect(service.findMealPlanById('123', queryDto, 'test-user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user lacks access', async () => {
      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(false);

      await expect(service.findMealPlanById('123', queryDto, 'test-user-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle different view modes', async () => {
      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findByIdWithRecipesFiltered.mockResolvedValue(mockMealPlanWithRecipes);

      const dayQueryDto: MealPlanByIdQueryDto = {
        viewMode: 'day',
        filterDate: new Date(2024, 2, 15),
        includeRecipes: true,
      };

      const result = await service.findMealPlanById('123', dayQueryDto, 'test-user-id');

      expect(result).toBeDefined();
    });
  });

  describe('view transformation methods', () => {
    it('should get week start date correctly', () => {
      const testDate = new Date(2024, 2, 15); // March 15, 2024 (Friday)
      const weekStart = service['getWeekStart'](testDate);

      expect(weekStart.getDay()).toBe(1); // Monday
    });

    it('should get day of week name correctly', () => {
      const testDate = new Date(2024, 2, 15); // March 15, 2024 (Friday)
      const dayName = service['getDayOfWeekName'](testDate);

      expect(dayName).toBe('Friday');
    });

    it('should get month name correctly', () => {
      const monthName = service['getMonthName'](3);

      expect(monthName).toBe('March');
    });

    it('should handle invalid month number', () => {
      const monthName = service['getMonthName'](13);

      expect(monthName).toBe('Unknown');
    });

    it('should get week number correctly', () => {
      const testDate = new Date(2024, 2, 15); // March 15, 2024
      const weekNumber = service['getWeekNumber'](testDate);

      expect(typeof weekNumber).toBe('number');
      expect(weekNumber).toBeGreaterThan(0);
    });
  });

  describe('date range methods', () => {
    it('should get date range from single filter date', () => {
      const filterDate = new Date(2024, 2, 15);
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'day',
        filterDate: filterDate,
      };

      const dateRange = service['getDateRangeFromQuery'](queryDto);

      expect(dateRange).toEqual({
        startDate: filterDate,
        endDate: filterDate,
      });
    });

    it('should get date range from start and end dates', () => {
      const startDate = new Date(2024, 2, 11);
      const endDate = new Date(2024, 2, 17);
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'week',
        filterStartDate: startDate,
        filterEndDate: endDate,
      };

      const dateRange = service['getDateRangeFromQuery'](queryDto);

      expect(dateRange).toEqual({
        startDate: startDate,
        endDate: endDate,
      });
    });

    it('should get date range from year and month', () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'month',
        filterYear: 2024,
        filterMonth: 3,
      };

      const dateRange = service['getDateRangeFromQuery'](queryDto);

      expect(dateRange).toBeDefined();
      expect(dateRange?.startDate?.getMonth()).toBe(2); // March (0-indexed)
      expect(dateRange?.endDate?.getMonth()).toBe(2);
    });

    it('should return undefined when no date filters provided', () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'full',
      };

      const dateRange = service['getDateRangeFromQuery'](queryDto);

      expect(dateRange).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle meal plan not found', () => {
      expect(() => service['handleMealPlanNotFound']('123')).toThrow(NotFoundException);
    });

    it('should handle unauthorized access', () => {
      expect(() => service['handleUnauthorizedAccess']('123', 'user-id')).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('meal plan access verification', () => {
    it('should verify meal plan access successfully', async () => {
      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);

      // Verifying the call completes without throwing
      await service['verifyMealPlanAccess'](BigInt(123), 'test-user-id');
      // If we got here, the function did not throw
      expect(true).toBe(true);
    });

    it('should throw ForbiddenException when access denied', async () => {
      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(false);

      await expect(service['verifyMealPlanAccess'](BigInt(123), 'test-user-id')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate statistics successfully', async () => {
      const mockStats = {
        totalRecipes: 10,
        daysWithMeals: 5,
        mealTypeCounts: [
          { mealType: MealType.BREAKFAST, count: 5 },
          { mealType: MealType.LUNCH, count: 3 },
          { mealType: MealType.DINNER, count: 2 },
        ],
        uniqueDates: [
          new Date('2024-03-01'),
          new Date('2024-03-02'),
          new Date('2024-03-03'),
          new Date('2024-03-04'),
          new Date('2024-03-05'),
        ],
      };
      repository.getMealPlanStatistics.mockResolvedValue(mockStats);

      const result = await service['calculateStatistics'](BigInt(123));

      expect(result).toBeDefined();
      expect(result.totalRecipes).toBe(10);
      expect(result.averageRecipesPerDay).toBe(2);
      expect(result.mealTypeBreakdown).toBeDefined();
    });

    it('should handle zero recipes', async () => {
      const mockStats = {
        totalRecipes: 0,
        daysWithMeals: 0,
        mealTypeCounts: [],
        uniqueDates: [],
      };
      repository.getMealPlanStatistics.mockResolvedValue(mockStats);

      const result = await service['calculateStatistics'](BigInt(123));

      expect(result.totalRecipes).toBe(0);
      expect(result.averageRecipesPerDay).toBe(0);
    });
  });

  describe('view transformations', () => {
    const mockMealPlanWithRecipes = {
      mealPlanId: BigInt(123),
      name: 'Test Plan',
      description: 'Test Description',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-07'),
      isActive: true,
      mealPlanRecipes: [
        {
          mealPlanId: BigInt(123),
          recipeId: BigInt(456),
          mealDate: new Date('2024-03-15'),
          mealType: MealType.BREAKFAST,
          recipe: {
            recipeId: BigInt(456),
            title: 'Test Recipe',
            userId: 'test-user-id',
          },
        },
        {
          mealPlanId: BigInt(123),
          recipeId: BigInt(789),
          mealDate: new Date('2024-03-15'),
          mealType: MealType.LUNCH,
          recipe: {
            recipeId: BigInt(789),
            title: 'Test Recipe 2',
            userId: 'test-user-id',
          },
        },
      ],
    };

    describe('transformToDayView', () => {
      it('should transform meal plan to day view', () => {
        const queryDto = { filterDate: new Date('2024-03-15') };
        const result = service['transformToDayView'](mockMealPlanWithRecipes, queryDto);

        expect(result).toBeDefined();
        expect(result.mealPlanId).toBe('123');
        expect(result.mealPlanName).toBe('Test Plan');
        expect(result.totalMeals).toBe(2);
      });

      it('should use current date when no filter date provided', () => {
        const queryDto = {};
        const result = service['transformToDayView'](mockMealPlanWithRecipes, queryDto);

        expect(result).toBeDefined();
        expect(result.date).toBeInstanceOf(Date);
      });
    });

    describe('transformToWeekView', () => {
      it('should transform meal plan to week view', () => {
        const queryDto = { filterStartDate: new Date('2024-03-11') };
        const result = service['transformToWeekView'](mockMealPlanWithRecipes, queryDto);

        expect(result).toBeDefined();
        expect(result.mealPlanId).toBe('123');
        expect(result.days).toHaveLength(7);
        expect(result.weekNumber).toBeGreaterThan(0);
      });

      it('should use week start when no filter start date provided', () => {
        const queryDto = {};
        const result = service['transformToWeekView'](mockMealPlanWithRecipes, queryDto);

        expect(result).toBeDefined();
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
      });
    });

    describe('transformToMonthView', () => {
      it('should transform meal plan to month view', () => {
        const queryDto = { filterYear: 2024, filterMonth: 3 };
        const result = service['transformToMonthView'](mockMealPlanWithRecipes, queryDto);

        expect(result).toBeDefined();
        expect(result.mealPlanId).toBe('123');
        expect(result.year).toBe(2024);
        expect(result.month).toBe(3);
        expect(result.monthName).toBe('March');
        expect(result.weeks).toBeDefined();
      });

      it('should use current date when no filter provided', () => {
        const queryDto = {};
        const result = service['transformToMonthView'](mockMealPlanWithRecipes, queryDto);

        expect(result).toBeDefined();
        expect(result.year).toBeGreaterThan(0);
        expect(result.month).toBeGreaterThan(0);
        expect(result.month).toBeLessThanOrEqual(12);
      });
    });
  });

  describe('validation methods', () => {
    describe('validateViewModeParams', () => {
      it('should validate day view parameters', () => {
        const queryDto = { viewMode: 'day' as const };
        expect(() => service['validateViewModeParams'](queryDto)).toThrow('filterDate is required');
      });

      it('should validate week view parameters', () => {
        const queryDto = { viewMode: 'week' as const };
        expect(() => service['validateViewModeParams'](queryDto)).toThrow(
          'filterStartDate is required',
        );
      });

      it('should validate month view parameters', () => {
        const queryDto = { viewMode: 'month' as const };
        expect(() => service['validateViewModeParams'](queryDto)).toThrow(
          'filterYear and filterMonth are required',
        );
      });

      it('should validate month range', () => {
        const queryDto = { viewMode: 'month' as const, filterYear: 2024, filterMonth: 13 };
        expect(() => service['validateViewModeParams'](queryDto)).toThrow(
          'filterMonth must be between 1 and 12',
        );
      });

      it('should validate year range', () => {
        const queryDto = { viewMode: 'month' as const, filterYear: 2019, filterMonth: 1 };
        expect(() => service['validateViewModeParams'](queryDto)).toThrow(
          'filterYear must be between 2020 and 2100',
        );
      });

      it('should pass validation for valid parameters', () => {
        const queryDto = { viewMode: 'month' as const, filterYear: 2024, filterMonth: 3 };
        expect(() => service['validateViewModeParams'](queryDto)).not.toThrow();
      });
    });

    describe('validateDateRanges', () => {
      it('should validate date ranges', () => {
        const startDate = new Date('2024-03-15');
        const endDate = new Date('2024-03-10');
        expect(() => service['validateDateRanges'](startDate, endDate)).toThrow(
          'Start date must be before',
        );
      });

      it('should validate date range duration', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2025-01-02'); // More than 365 days
        expect(() => service['validateDateRanges'](startDate, endDate)).toThrow(
          'Date range cannot exceed one year',
        );
      });

      it('should pass for valid date ranges', () => {
        const startDate = new Date('2024-03-01');
        const endDate = new Date('2024-03-07');
        expect(() => service['validateDateRanges'](startDate, endDate)).not.toThrow();
      });
    });
  });

  describe('utility methods', () => {
    describe('parseMealPlanId', () => {
      it('should parse valid meal plan ID', () => {
        const result = service['parseMealPlanId']('123');
        expect(result).toBe(BigInt(123));
      });

      it('should throw NotFoundException for invalid ID', () => {
        expect(() => service['parseMealPlanId']('invalid')).toThrow(NotFoundException);
      });
    });

    describe('groupRecipesByMealType', () => {
      it('should group recipes by meal type', () => {
        const recipes = [
          { mealType: 'BREAKFAST' } as any,
          { mealType: 'LUNCH' } as any,
          { mealType: 'BREAKFAST' } as any,
        ];
        const result = service['groupRecipesByMealType'](recipes);

        expect(result.breakfast).toHaveLength(2);
        expect(result.lunch).toHaveLength(1);
        expect(result.dinner).toHaveLength(0);
      });
    });

    describe('getDateRangeFromQuery', () => {
      it('should get date range from single filter date', () => {
        const queryDto = { filterDate: new Date('2024-03-15') };
        const result = service['getDateRangeFromQuery'](queryDto);

        expect(result).toBeDefined();
        expect(result?.startDate).toEqual(queryDto.filterDate);
        expect(result?.endDate).toEqual(queryDto.filterDate);
      });

      it('should get date range from start and end dates', () => {
        const queryDto = {
          filterStartDate: new Date('2024-03-01'),
          filterEndDate: new Date('2024-03-07'),
        };
        const result = service['getDateRangeFromQuery'](queryDto);

        expect(result).toBeDefined();
        expect(result?.startDate).toEqual(queryDto.filterStartDate);
        expect(result?.endDate).toEqual(queryDto.filterEndDate);
      });

      it('should get date range from year and month', () => {
        const queryDto = { filterYear: 2024, filterMonth: 3 };
        const result = service['getDateRangeFromQuery'](queryDto);

        expect(result).toBeDefined();
        expect(result?.startDate?.getFullYear()).toBe(2024);
        expect(result?.startDate?.getMonth()).toBe(2); // 0-indexed
      });

      it('should return undefined for no date filters', () => {
        const queryDto = {};
        const result = service['getDateRangeFromQuery'](queryDto);

        expect(result).toBeUndefined();
      });
    });
  });

  describe('buildMonthWeeks', () => {
    it('should build month weeks structure', () => {
      const recipes = [
        {
          mealPlanId: BigInt(123),
          recipeId: BigInt(456),
          mealDate: new Date('2024-03-15'),
          mealType: MealType.BREAKFAST,
        },
      ];
      const result = service['buildMonthWeeks'](2024, 3, recipes);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toBeDefined();
      expect(result[0]!.weekNumber).toBeDefined();
      expect(result[0]!.days).toBeDefined();
      expect(result[0]!.days).toHaveLength(7);
    });
  });

  describe('getRecipesForViewMode', () => {
    beforeEach(() => {
      repository.findRecipesForDateRange.mockResolvedValue([]);
      repository.findRecipesForWeek.mockResolvedValue([]);
      repository.findRecipesForMonth.mockResolvedValue([]);
    });

    it('should get recipes for day view mode', async () => {
      const queryDto = { viewMode: 'day' as const, filterDate: new Date('2024-03-15') };
      await service['getRecipesForViewMode'](BigInt(123), queryDto);

      expect(repository.findRecipesForDateRange).toHaveBeenCalledWith(
        BigInt(123),
        queryDto.filterDate,
        queryDto.filterDate,
        { mealType: undefined },
      );
    });

    it('should get recipes for week view mode', async () => {
      const queryDto = { viewMode: 'week' as const, filterStartDate: new Date('2024-03-11') };
      await service['getRecipesForViewMode'](BigInt(123), queryDto);

      expect(repository.findRecipesForWeek).toHaveBeenCalledWith(
        BigInt(123),
        queryDto.filterStartDate,
        { mealType: undefined },
      );
    });

    it('should get recipes for month view mode', async () => {
      const queryDto = { viewMode: 'month' as const, filterYear: 2024, filterMonth: 3 };
      await service['getRecipesForViewMode'](BigInt(123), queryDto);

      expect(repository.findRecipesForMonth).toHaveBeenCalledWith(BigInt(123), 2024, 3, {
        mealType: undefined,
      });
    });

    it('should return empty array for unsupported view modes', async () => {
      const queryDto = { viewMode: 'day' as const }; // Missing required filterDate
      const result = await service['getRecipesForViewMode'](BigInt(123), queryDto);

      expect(result).toEqual([]);
    });
  });

  describe('handleRecipeGrouping', () => {
    const mockRecipes = [{ mealType: 'BREAKFAST' } as any, { mealType: 'LUNCH' } as any];

    it('should group recipes when groupByMealType is true', () => {
      const result = service['handleRecipeGrouping'](mockRecipes, true);

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('breakfast');
      expect(result).toHaveProperty('lunch');
    });

    it('should return recipes as-is when groupByMealType is false', () => {
      const result = service['handleRecipeGrouping'](mockRecipes, false);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockRecipes);
    });
  });

  describe('error scenarios for findMealPlanById', () => {
    const queryDto: MealPlanByIdQueryDto = { viewMode: 'full', includeRecipes: true };

    it('should handle meal plan not found after verification passes', async () => {
      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findByIdWithRecipesFiltered.mockResolvedValue(null);

      await expect(service.findMealPlanById('123', queryDto, 'test-user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include statistics when requested', async () => {
      const queryDtoWithStats = { ...queryDto, includeStatistics: true };
      const mockStats = {
        totalRecipes: 5,
        daysWithMeals: 3,
        mealTypeCounts: [{ mealType: MealType.BREAKFAST, count: 5 }],
        uniqueDates: [new Date('2024-03-01'), new Date('2024-03-02'), new Date('2024-03-03')],
      };

      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findByIdWithRecipesFiltered.mockResolvedValue(mockMealPlanWithRecipes);
      repository.getMealPlanStatistics.mockResolvedValue(mockStats);

      const result = await service.findMealPlanById('123', queryDtoWithStats, 'test-user-id');

      expect(result.statistics).toBeDefined();
    });

    it('should handle different view modes in findMealPlanById', async () => {
      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findByIdWithRecipesFiltered.mockResolvedValue(mockMealPlanWithRecipes);

      const dayQuery = {
        viewMode: 'day' as const,
        filterDate: new Date('2024-03-15'),
        includeRecipes: true,
      };
      const result = await service.findMealPlanById('123', dayQuery, 'test-user-id');

      expect(result.viewMode).toBe('day');
      expect(result.data).toBeDefined();
    });
  });

  describe('additional branch coverage tests', () => {
    it('should use findById when no recipes are requested', async () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'full',
        includeRecipes: false,
      };

      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findById.mockResolvedValue({
        mealPlanId: BigInt(123),
        userId: 'test-user-id',
        name: 'Test Plan',
        description: 'Test Description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isArchived: false,
      } as any);

      await service.findMealPlanById('123', queryDto, 'test-user-id');

      expect(repository.findById).toHaveBeenCalledWith(BigInt(123));
      expect(repository.findByIdWithRecipesFiltered).not.toHaveBeenCalled();
    });

    it('should handle meal type filter with date range', async () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'full',
        includeRecipes: true,
        mealType: MealType.BREAKFAST,
        filterStartDate: new Date('2024-01-01'),
        filterEndDate: new Date('2024-01-07'),
      };

      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findByIdWithRecipesFiltered.mockResolvedValue(mockMealPlanWithRecipes);

      await service.findMealPlanById('123', queryDto, 'test-user-id');

      expect(repository.findByIdWithRecipesFiltered).toHaveBeenCalledWith(BigInt(123), {
        mealType: MealType.BREAKFAST,
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
        },
      });
    });

    it('should handle meal type filter without date range', async () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'full',
        includeRecipes: true,
        mealType: MealType.LUNCH,
      };

      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findByIdWithRecipesFiltered.mockResolvedValue(mockMealPlanWithRecipes);

      await service.findMealPlanById('123', queryDto, 'test-user-id');

      expect(repository.findByIdWithRecipesFiltered).toHaveBeenCalledWith(BigInt(123), {
        mealType: MealType.LUNCH,
      });
    });

    it('should handle includeRecipes true without meal type filter', async () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'full',
        includeRecipes: true,
      };

      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findByIdWithRecipesFiltered.mockResolvedValue(mockMealPlanWithRecipes);

      await service.findMealPlanById('123', queryDto, 'test-user-id');

      expect(repository.findByIdWithRecipesFiltered).toHaveBeenCalledWith(BigInt(123), undefined);
    });

    it('should handle statistics when includeStatistics is false', async () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'full',
        includeStatistics: false,
      };

      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);
      repository.findById.mockResolvedValue({
        mealPlanId: BigInt(123),
        userId: 'test-user-id',
        name: 'Test Plan',
        description: 'Test Description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isArchived: false,
      } as any);

      const result = await service.findMealPlanById('123', queryDto, 'test-user-id');

      expect(result.statistics).toBeUndefined();
      expect(repository.getMealPlanStatistics).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for day view without filterDate', async () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'day',
      };

      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);

      await expect(service.findMealPlanById('123', queryDto, 'test-user-id')).rejects.toThrow(
        'filterDate is required for day view mode',
      );
    });

    it('should throw BadRequestException for week view without filterStartDate', async () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'week',
      };

      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);

      await expect(service.findMealPlanById('123', queryDto, 'test-user-id')).rejects.toThrow(
        'filterStartDate is required for week view mode',
      );
    });

    it('should throw BadRequestException for month view without year/month', async () => {
      const queryDto: MealPlanByIdQueryDto = {
        viewMode: 'month',
      };

      repository.checkMealPlanExists.mockResolvedValue(true);
      repository.verifyMealPlanOwnership.mockResolvedValue(true);

      await expect(service.findMealPlanById('123', queryDto, 'test-user-id')).rejects.toThrow(
        'filterYear and filterMonth are required for month view mode',
      );
    });
  });
});
