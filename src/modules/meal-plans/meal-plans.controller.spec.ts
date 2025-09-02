import { Test, TestingModule } from '@nestjs/testing';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';
import {
  MealPlanQueryDto,
  PaginationDto,
  MealPlanByIdQueryDto,
  PaginatedMealPlansResponseDto,
  MealPlanQueryResponseDto,
  CreateMealPlanDto,
  UpdateMealPlanDto,
  MealPlanResponseDto,
} from './dto';
import { MealType } from './enums/meal-type.enum';

describe('MealPlansController', () => {
  let controller: MealPlansController;
  let service: jest.Mocked<MealPlansService>;

  const mockService = {
    findMealPlans: jest.fn(),
    findMealPlanById: jest.fn(),
    createMealPlan: jest.fn(),
    updateMealPlan: jest.fn(),
    deleteMealPlan: jest.fn(),
  };

  const mockPaginatedResponse: PaginatedMealPlansResponseDto = {
    data: [
      {
        mealPlanId: '123',
        name: 'Test Meal Plan',
        description: 'Test Description',
        userId: 'test-user-id',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
        totalRecipes: 5,
        mealPlanRecipes: [],
      },
    ],
    meta: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  const mockMealPlanResponse: MealPlanQueryResponseDto = {
    mealPlan: {
      mealPlanId: '123',
      name: 'Test Meal Plan',
      description: 'Test Description',
      userId: 'test-user-id',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-07'),
      createdAt: new Date(),
      updatedAt: new Date(),
      totalRecipes: 5,
      mealPlanRecipes: [],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealPlansController],
      providers: [
        {
          provide: MealPlansService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MealPlansController>(MealPlansController);
    service = module.get(MealPlansService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listMealPlans', () => {
    const queryDto: MealPlanQueryDto = {
      userId: 'test-user-id',
      isActive: true,
      includeRecipes: false,
    };

    const paginationDto: PaginationDto = {
      page: 1,
      limit: 20,
    };

    it('should return paginated meal plans', async () => {
      service.findMealPlans.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.listMealPlans(queryDto, paginationDto);

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findMealPlans).toHaveBeenCalledWith(
        queryDto,
        paginationDto,
        'temp-user-id', // Current temporary user ID
      );
    });

    it('should handle empty query parameters', async () => {
      const emptyQuery: MealPlanQueryDto = {};
      const defaultPagination: PaginationDto = { page: 1, limit: 20 };

      service.findMealPlans.mockResolvedValue({
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const result = await controller.listMealPlans(emptyQuery, defaultPagination);

      expect(result.data).toEqual([]);
      expect(service.findMealPlans).toHaveBeenCalledWith(
        emptyQuery,
        defaultPagination,
        'temp-user-id',
      );
    });

    it('should handle filtering parameters', async () => {
      const filterQuery: MealPlanQueryDto = {
        isActive: true,
        startDateFrom: new Date('2024-03-01'),
        endDateTo: new Date('2024-03-31'),
        nameSearch: 'family',
        includeRecipes: true,
      };

      service.findMealPlans.mockResolvedValue(mockPaginatedResponse);

      await controller.listMealPlans(filterQuery, paginationDto);

      expect(service.findMealPlans).toHaveBeenCalledWith(
        filterQuery,
        paginationDto,
        'temp-user-id',
      );
    });
  });

  describe('getMealPlanById', () => {
    const queryDto: MealPlanByIdQueryDto = {
      viewMode: 'full',
      includeRecipes: true,
    };

    it('should return meal plan by id', async () => {
      service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

      const result = await controller.getMealPlanById('123', queryDto);

      expect(result).toEqual(mockMealPlanResponse);
      expect(service.findMealPlanById).toHaveBeenCalledWith('123', queryDto, 'temp-user-id');
    });

    it('should handle day view mode', async () => {
      const dayQuery: MealPlanByIdQueryDto = {
        viewMode: 'day',
        filterDate: new Date('2024-03-15'),
        includeRecipes: true,
      };

      service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

      await controller.getMealPlanById('123', dayQuery);

      expect(service.findMealPlanById).toHaveBeenCalledWith('123', dayQuery, 'temp-user-id');
    });

    it('should handle week view mode', async () => {
      const weekQuery: MealPlanByIdQueryDto = {
        viewMode: 'week',
        filterStartDate: new Date('2024-03-11'),
        includeRecipes: true,
      };

      service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

      await controller.getMealPlanById('123', weekQuery);

      expect(service.findMealPlanById).toHaveBeenCalledWith('123', weekQuery, 'temp-user-id');
    });

    it('should handle month view mode', async () => {
      const monthQuery: MealPlanByIdQueryDto = {
        viewMode: 'month',
        filterYear: 2024,
        filterMonth: 3,
        includeStatistics: true,
      };

      service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

      await controller.getMealPlanById('123', monthQuery);

      expect(service.findMealPlanById).toHaveBeenCalledWith('123', monthQuery, 'temp-user-id');
    });

    it('should handle meal type filtering', async () => {
      const filteredQuery: MealPlanByIdQueryDto = {
        viewMode: 'full',
        mealType: MealType.DINNER,
        includeRecipes: true,
      };

      service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

      await controller.getMealPlanById('123', filteredQuery);

      expect(service.findMealPlanById).toHaveBeenCalledWith('123', filteredQuery, 'temp-user-id');
    });
  });

  describe('error scenarios', () => {
    describe('listMealPlans', () => {
      const queryDto: MealPlanQueryDto = {};
      const paginationDto: PaginationDto = { page: 1, limit: 20 };

      it('should throw NotFoundException when service throws NotFoundException', async () => {
        const error = new Error('Meal plans not found');
        error.name = 'NotFoundException';
        service.findMealPlans.mockRejectedValue(error);

        await expect(controller.listMealPlans(queryDto, paginationDto)).rejects.toThrow(error);
        expect(service.findMealPlans).toHaveBeenCalledWith(queryDto, paginationDto, 'temp-user-id');
      });

      it('should throw ForbiddenException when service throws ForbiddenException', async () => {
        const error = new Error('Access denied');
        error.name = 'ForbiddenException';
        service.findMealPlans.mockRejectedValue(error);

        await expect(controller.listMealPlans(queryDto, paginationDto)).rejects.toThrow(error);
      });

      it('should throw BadRequestException when service throws BadRequestException', async () => {
        const error = new Error('Invalid query parameters');
        error.name = 'BadRequestException';
        service.findMealPlans.mockRejectedValue(error);

        await expect(controller.listMealPlans(queryDto, paginationDto)).rejects.toThrow(error);
      });

      it('should throw InternalServerErrorException when service throws unexpected error', async () => {
        const error = new Error('Database connection failed');
        service.findMealPlans.mockRejectedValue(error);

        await expect(controller.listMealPlans(queryDto, paginationDto)).rejects.toThrow(error);
      });
    });

    describe('getMealPlanById', () => {
      const queryDto: MealPlanByIdQueryDto = { viewMode: 'full' };

      it('should throw NotFoundException when meal plan does not exist', async () => {
        const error = new Error('Meal plan with id "999" not found');
        error.name = 'NotFoundException';
        service.findMealPlanById.mockRejectedValue(error);

        await expect(controller.getMealPlanById('999', queryDto)).rejects.toThrow(error);
        expect(service.findMealPlanById).toHaveBeenCalledWith('999', queryDto, 'temp-user-id');
      });

      it('should throw ForbiddenException when user lacks access to meal plan', async () => {
        const error = new Error('Access denied to meal plan');
        error.name = 'ForbiddenException';
        service.findMealPlanById.mockRejectedValue(error);

        await expect(controller.getMealPlanById('123', queryDto)).rejects.toThrow(error);
      });

      it('should throw BadRequestException when meal plan ID is invalid', async () => {
        const error = new Error('Invalid meal plan ID format');
        error.name = 'BadRequestException';
        service.findMealPlanById.mockRejectedValue(error);

        await expect(controller.getMealPlanById('invalid-id', queryDto)).rejects.toThrow(error);
      });

      it('should throw BadRequestException when view mode parameters are invalid', async () => {
        const invalidQuery: MealPlanByIdQueryDto = { viewMode: 'day' }; // Missing required filterDate
        const error = new Error('Missing required filterDate for day view');
        error.name = 'BadRequestException';
        service.findMealPlanById.mockRejectedValue(error);

        await expect(controller.getMealPlanById('123', invalidQuery)).rejects.toThrow(error);
      });

      it('should throw BadRequestException when date range is invalid', async () => {
        const invalidQuery: MealPlanByIdQueryDto = {
          viewMode: 'full',
          filterStartDate: new Date('2025-01-01'),
          filterEndDate: new Date('2024-01-01'), // End before start
        };
        const error = new Error('Invalid date range: end date must be after start date');
        error.name = 'BadRequestException';
        service.findMealPlanById.mockRejectedValue(error);

        await expect(controller.getMealPlanById('123', invalidQuery)).rejects.toThrow(error);
      });

      it('should throw BadRequestException when month/year parameters are invalid', async () => {
        const invalidQuery: MealPlanByIdQueryDto = {
          viewMode: 'month',
          filterYear: 2024,
          filterMonth: 13, // Invalid month
        };
        const error = new Error('Invalid month: must be between 1 and 12');
        error.name = 'BadRequestException';
        service.findMealPlanById.mockRejectedValue(error);

        await expect(controller.getMealPlanById('123', invalidQuery)).rejects.toThrow(error);
      });

      it('should handle database timeout errors', async () => {
        const error = new Error('Database operation timed out');
        error.name = 'TimeoutError';
        service.findMealPlanById.mockRejectedValue(error);

        await expect(controller.getMealPlanById('123', queryDto)).rejects.toThrow(error);
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    describe('listMealPlans', () => {
      it('should handle maximum pagination limit', async () => {
        const queryDto: MealPlanQueryDto = {};
        const maxPagination: PaginationDto = { page: 1, limit: 100 }; // Assuming max limit

        service.findMealPlans.mockResolvedValue({
          data: [],
          meta: {
            page: 1,
            limit: 100,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });

        const result = await controller.listMealPlans(queryDto, maxPagination);

        expect(result.meta.limit).toBe(100);
        expect(service.findMealPlans).toHaveBeenCalledWith(queryDto, maxPagination, 'temp-user-id');
      });

      it('should handle very large page numbers', async () => {
        const queryDto: MealPlanQueryDto = {};
        const largePagination: PaginationDto = { page: 1000, limit: 20 };

        service.findMealPlans.mockResolvedValue({
          data: [],
          meta: {
            page: 1000,
            limit: 20,
            total: 5,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: true,
          },
        });

        const result = await controller.listMealPlans(queryDto, largePagination);

        expect(result.meta.page).toBe(1000);
        expect(result.data).toEqual([]);
      });

      it('should handle special characters in search terms', async () => {
        const queryDto: MealPlanQueryDto = {
          nameSearch: 'Mom\'s "Special" Recipe & More!',
          descriptionSearch: 'Test with @#$%^&*() symbols',
        };
        const paginationDto: PaginationDto = { page: 1, limit: 20 };

        service.findMealPlans.mockResolvedValue({
          data: [],
          meta: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });

        await controller.listMealPlans(queryDto, paginationDto);

        expect(service.findMealPlans).toHaveBeenCalledWith(queryDto, paginationDto, 'temp-user-id');
      });

      it('should handle extreme date ranges', async () => {
        const queryDto: MealPlanQueryDto = {
          startDateFrom: new Date('1900-01-01'),
          endDateTo: new Date('2100-12-31'),
        };
        const paginationDto: PaginationDto = { page: 1, limit: 20 };

        service.findMealPlans.mockResolvedValue({
          data: [],
          meta: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });

        await controller.listMealPlans(queryDto, paginationDto);

        expect(service.findMealPlans).toHaveBeenCalledWith(queryDto, paginationDto, 'temp-user-id');
      });
    });

    describe('getMealPlanById', () => {
      it('should handle very large meal plan IDs', async () => {
        const largeId = '999999999999999999'; // Very large ID
        const queryDto: MealPlanByIdQueryDto = { viewMode: 'full' };

        service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

        await controller.getMealPlanById(largeId, queryDto);

        expect(service.findMealPlanById).toHaveBeenCalledWith(largeId, queryDto, 'temp-user-id');
      });

      it('should handle edge case dates for day view', async () => {
        const queryDto: MealPlanByIdQueryDto = {
          viewMode: 'day',
          filterDate: new Date('2000-02-29'), // Leap year edge case
        };

        service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

        await controller.getMealPlanById('123', queryDto);

        expect(service.findMealPlanById).toHaveBeenCalledWith('123', queryDto, 'temp-user-id');
      });

      it('should handle year boundaries for month view', async () => {
        const queryDto: MealPlanByIdQueryDto = {
          viewMode: 'month',
          filterYear: 2024,
          filterMonth: 12, // December - year boundary
        };

        service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

        await controller.getMealPlanById('123', queryDto);

        expect(service.findMealPlanById).toHaveBeenCalledWith('123', queryDto, 'temp-user-id');
      });

      it('should handle all meal types', async () => {
        for (const mealType of Object.values(MealType)) {
          const queryDto: MealPlanByIdQueryDto = {
            viewMode: 'full',
            mealType: mealType as MealType,
          };

          service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

          await controller.getMealPlanById('123', queryDto);

          expect(service.findMealPlanById).toHaveBeenCalledWith('123', queryDto, 'temp-user-id');
        }
      });

      it('should handle complex query combinations', async () => {
        const complexQuery: MealPlanByIdQueryDto = {
          viewMode: 'month',
          filterYear: 2024,
          filterMonth: 3,
          mealType: MealType.BREAKFAST,
          groupByMealType: true,
          includeRecipes: true,
          includeStatistics: true,
        };

        service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

        await controller.getMealPlanById('123', complexQuery);

        expect(service.findMealPlanById).toHaveBeenCalledWith('123', complexQuery, 'temp-user-id');
      });
    });
  });

  describe('createMealPlan', () => {
    const createMealPlanDto: CreateMealPlanDto = {
      name: 'Test Meal Plan',
      description: 'A test meal plan description',
      startDate: new Date('2024-03-10'),
      endDate: new Date('2024-03-16'),
      recipes: [
        {
          recipeId: '456e789a-12b3-45c6-789d-0123456789ef',
          day: 1,
          mealType: MealType.BREAKFAST,
          servings: 2,
          notes: 'Test recipe notes',
        },
      ],
    } as any;

    const expectedResponse: MealPlanResponseDto = {
      mealPlanId: '123',
      name: 'Test Meal Plan',
      description: 'A test meal plan description',
      userId: 'temp-user-id',
      startDate: new Date('2024-03-10'),
      endDate: new Date('2024-03-16'),
      createdAt: new Date(),
      updatedAt: new Date(),
      recipes: [],
    };

    it('should create a meal plan successfully', async () => {
      service.createMealPlan.mockResolvedValue(expectedResponse);

      const result = await controller.createMealPlan(createMealPlanDto);

      expect(service.createMealPlan).toHaveBeenCalledWith(createMealPlanDto, 'temp-user-id');
      expect(result).toEqual(expectedResponse);
    });

    it('should create a meal plan without recipes', async () => {
      const simpleDto: CreateMealPlanDto = {
        name: 'Simple Meal Plan',
        description: 'No recipes',
        startDate: new Date('2024-03-10'),
        endDate: new Date('2024-03-16'),
      } as any;

      const simpleResponse = {
        ...expectedResponse,
        name: 'Simple Meal Plan',
        description: 'No recipes',
        recipes: [],
      };

      service.createMealPlan.mockResolvedValue(simpleResponse);

      const result = await controller.createMealPlan(simpleDto);

      expect(service.createMealPlan).toHaveBeenCalledWith(simpleDto, 'temp-user-id');
      expect(result).toEqual(simpleResponse);
    });

    it('should create a meal plan with minimal data', async () => {
      const minimalDto: CreateMealPlanDto = {
        name: 'Minimal Meal Plan',
        startDate: new Date('2024-03-10'),
        endDate: new Date('2024-03-16'),
      } as any;

      const minimalResponse = {
        ...expectedResponse,
        name: 'Minimal Meal Plan',
        description: null,
      };

      service.createMealPlan.mockResolvedValue(minimalResponse);

      const result = await controller.createMealPlan(minimalDto);

      expect(service.createMealPlan).toHaveBeenCalledWith(minimalDto, 'temp-user-id');
      expect(result).toEqual(minimalResponse);
    });

    describe('error handling', () => {
      it('should throw BadRequestException when validation fails', async () => {
        const invalidDto = {
          // Missing required name field
          description: 'Invalid meal plan',
          startDate: new Date('2024-03-10'),
          endDate: new Date('2024-03-16'),
        } as any;

        const error = new Error('Validation failed: Name is required');
        error.name = 'BadRequestException';
        service.createMealPlan.mockRejectedValue(error);

        await expect(controller.createMealPlan(invalidDto)).rejects.toThrow(error);
        expect(service.createMealPlan).toHaveBeenCalledWith(invalidDto, 'temp-user-id');
      });

      it('should throw BadRequestException for date range conflicts', async () => {
        const conflictDto = {
          ...createMealPlanDto,
          startDate: new Date('2024-03-16'),
          endDate: new Date('2024-03-10'), // End before start
        };

        const error = new Error('Invalid date range: end date must be after start date');
        error.name = 'BadRequestException';
        service.createMealPlan.mockRejectedValue(error);

        await expect(controller.createMealPlan(conflictDto)).rejects.toThrow(error);
      });

      it('should throw ConflictException for overlapping meal plans', async () => {
        const overlappingDto = {
          ...createMealPlanDto,
          startDate: new Date('2024-03-05'),
          endDate: new Date('2024-03-12'),
        };

        const error = new Error('Meal plan overlaps with existing plan');
        error.name = 'ConflictException';
        service.createMealPlan.mockRejectedValue(error);

        await expect(controller.createMealPlan(overlappingDto)).rejects.toThrow(error);
      });

      it('should handle database errors', async () => {
        const error = new Error('Database connection failed');
        error.name = 'InternalServerErrorException';
        service.createMealPlan.mockRejectedValue(error);

        await expect(controller.createMealPlan(createMealPlanDto)).rejects.toThrow(error);
      });
    });

    describe('recipe validation', () => {
      it('should create meal plan with multiple recipes on different days', async () => {
        const multiRecipeDto = {
          ...createMealPlanDto,
          recipes: [
            {
              recipeId: '456e789a-12b3-45c6-789d-0123456789ef',
              day: 1,
              mealType: MealType.BREAKFAST,
              servings: 2,
            },
            {
              recipeId: '789e012b-34c5-67d8-901e-23456789abcd',
              day: 2,
              mealType: MealType.LUNCH,
              servings: 4,
            },
            {
              recipeId: '012e345c-67d8-90e1-234f-56789abcdef0',
              day: 1,
              mealType: MealType.DINNER,
              servings: 3,
            },
          ],
        };

        service.createMealPlan.mockResolvedValue(expectedResponse);

        const result = await controller.createMealPlan(multiRecipeDto);

        expect(service.createMealPlan).toHaveBeenCalledWith(multiRecipeDto, 'temp-user-id');
        expect(result).toEqual(expectedResponse);
      });

      it('should handle invalid recipe IDs', async () => {
        const invalidRecipeDto = {
          ...createMealPlanDto,
          recipes: [
            {
              recipeId: 'invalid-uuid',
              day: 1,
              mealType: MealType.BREAKFAST,
            },
          ],
        };

        const error = new Error('Invalid recipe ID format');
        error.name = 'BadRequestException';
        service.createMealPlan.mockRejectedValue(error);

        await expect(controller.createMealPlan(invalidRecipeDto)).rejects.toThrow(error);
      });

      it('should handle invalid day numbers', async () => {
        const invalidDayDto = {
          ...createMealPlanDto,
          recipes: [
            {
              recipeId: '456e789a-12b3-45c6-789d-0123456789ef',
              day: 8, // Invalid day (> 7)
              mealType: MealType.BREAKFAST,
            },
          ],
        };

        const error = new Error('Day 8 is outside the meal plan date range');
        error.name = 'BadRequestException';
        service.createMealPlan.mockRejectedValue(error);

        await expect(controller.createMealPlan(invalidDayDto)).rejects.toThrow(error);
      });
    });
  });

  describe('PUT /meal-plans/:id (updateMealPlan)', () => {
    const mockMealPlanId = '123';
    const mockUserId = 'temp-user-id';

    const updateMealPlanDto: UpdateMealPlanDto = {
      name: 'Updated Meal Plan',
      description: 'Updated description',
      startDate: new Date('2024-03-15T00:00:00.000Z'),
      endDate: new Date('2024-03-21T23:59:59.999Z'),
    };

    const expectedResponse: MealPlanResponseDto = {
      mealPlanId: '123',
      name: 'Updated Meal Plan',
      description: 'Updated description',
      userId: 'temp-user-id',
      startDate: new Date('2024-03-15T00:00:00.000Z'),
      endDate: new Date('2024-03-21T23:59:59.999Z'),
      createdAt: new Date('2024-03-01T00:00:00.000Z'),
      updatedAt: new Date(),
      totalRecipes: 0,
      mealPlanRecipes: [],
    };

    beforeEach(() => {
      service.updateMealPlan.mockClear();
    });

    describe('successful updates', () => {
      it('should update a meal plan successfully with all fields', async () => {
        service.updateMealPlan.mockResolvedValue(expectedResponse);

        const result = await controller.updateMealPlan(mockMealPlanId, updateMealPlanDto);

        expect(service.updateMealPlan).toHaveBeenCalledWith(
          mockMealPlanId,
          updateMealPlanDto,
          mockUserId,
        );
        expect(result).toEqual(expectedResponse);
      });

      it('should update a meal plan with partial data', async () => {
        const partialUpdateDto: UpdateMealPlanDto = {
          name: 'Just Update Name',
        };

        const partialResponse = { ...expectedResponse, name: 'Just Update Name' };
        service.updateMealPlan.mockResolvedValue(partialResponse);

        const result = await controller.updateMealPlan(mockMealPlanId, partialUpdateDto);

        expect(service.updateMealPlan).toHaveBeenCalledWith(
          mockMealPlanId,
          partialUpdateDto,
          mockUserId,
        );
        expect(result).toEqual(partialResponse);
      });

      it('should update only the name field', async () => {
        const nameOnlyDto: UpdateMealPlanDto = {
          name: 'New Name Only',
        };

        service.updateMealPlan.mockResolvedValue({
          ...expectedResponse,
          name: 'New Name Only',
        });

        const result = await controller.updateMealPlan(mockMealPlanId, nameOnlyDto);

        expect(service.updateMealPlan).toHaveBeenCalledWith(
          mockMealPlanId,
          nameOnlyDto,
          mockUserId,
        );
        expect(result.name).toBe('New Name Only');
      });

      it('should update only the description field', async () => {
        const descriptionOnlyDto: UpdateMealPlanDto = {
          description: 'New description only',
        };

        service.updateMealPlan.mockResolvedValue({
          ...expectedResponse,
          description: 'New description only',
        });

        const result = await controller.updateMealPlan(mockMealPlanId, descriptionOnlyDto);

        expect(service.updateMealPlan).toHaveBeenCalledWith(
          mockMealPlanId,
          descriptionOnlyDto,
          mockUserId,
        );
        expect(result.description).toBe('New description only');
      });

      it('should update only date fields', async () => {
        const datesOnlyDto: UpdateMealPlanDto = {
          startDate: new Date('2024-04-01T00:00:00.000Z'),
          endDate: new Date('2024-04-07T23:59:59.999Z'),
        };

        service.updateMealPlan.mockResolvedValue({
          ...expectedResponse,
          startDate: new Date('2024-04-01T00:00:00.000Z'),
          endDate: new Date('2024-04-07T23:59:59.999Z'),
        });

        const result = await controller.updateMealPlan(mockMealPlanId, datesOnlyDto);

        expect(service.updateMealPlan).toHaveBeenCalledWith(
          mockMealPlanId,
          datesOnlyDto,
          mockUserId,
        );
        expect(result.startDate).toEqual(new Date('2024-04-01T00:00:00.000Z'));
        expect(result.endDate).toEqual(new Date('2024-04-07T23:59:59.999Z'));
      });

      it('should handle empty update (no fields provided)', async () => {
        const emptyDto: UpdateMealPlanDto = {};

        service.updateMealPlan.mockResolvedValue(expectedResponse);

        const result = await controller.updateMealPlan(mockMealPlanId, emptyDto);

        expect(service.updateMealPlan).toHaveBeenCalledWith(mockMealPlanId, emptyDto, mockUserId);
        expect(result).toEqual(expectedResponse);
      });
    });

    describe('error handling', () => {
      it('should handle meal plan not found', async () => {
        const error = new Error('Meal plan with ID 999 not found');
        error.name = 'NotFoundException';
        service.updateMealPlan.mockRejectedValue(error);

        await expect(controller.updateMealPlan('999', updateMealPlanDto)).rejects.toThrow(error);
      });

      it('should handle forbidden access (user does not own meal plan)', async () => {
        const error = new Error('You do not have permission to update this meal plan');
        error.name = 'ForbiddenException';
        service.updateMealPlan.mockRejectedValue(error);

        await expect(controller.updateMealPlan(mockMealPlanId, updateMealPlanDto)).rejects.toThrow(
          error,
        );
      });

      it('should handle validation errors', async () => {
        const invalidDto: UpdateMealPlanDto = {
          name: '', // Invalid: empty name
          description: 'a'.repeat(1001), // Invalid: too long
        };

        const error = new Error('Validation failed');
        error.name = 'BadRequestException';
        service.updateMealPlan.mockRejectedValue(error);

        await expect(controller.updateMealPlan(mockMealPlanId, invalidDto)).rejects.toThrow(error);
      });

      it('should handle date overlap conflicts', async () => {
        const conflictDto: UpdateMealPlanDto = {
          startDate: new Date('2024-03-01T00:00:00.000Z'),
          endDate: new Date('2024-03-07T23:59:59.999Z'),
        };

        const error = new Error('Updated dates would overlap with existing meal plan');
        error.name = 'ConflictException';
        service.updateMealPlan.mockRejectedValue(error);

        await expect(controller.updateMealPlan(mockMealPlanId, conflictDto)).rejects.toThrow(error);
      });

      it('should handle invalid date ranges', async () => {
        const invalidDateDto: UpdateMealPlanDto = {
          startDate: new Date('2024-03-07T00:00:00.000Z'),
          endDate: new Date('2024-03-01T23:59:59.999Z'), // End before start
        };

        const error = new Error('End date must be after start date');
        error.name = 'BadRequestException';
        service.updateMealPlan.mockRejectedValue(error);

        await expect(controller.updateMealPlan(mockMealPlanId, invalidDateDto)).rejects.toThrow(
          error,
        );
      });

      it('should handle general service errors', async () => {
        const error = new Error('Failed to update meal plan');
        error.name = 'BadRequestException';
        service.updateMealPlan.mockRejectedValue(error);

        await expect(controller.updateMealPlan(mockMealPlanId, updateMealPlanDto)).rejects.toThrow(
          error,
        );
      });
    });

    describe('parameter validation', () => {
      it('should work with different meal plan ID formats', async () => {
        const testIds = ['1', '123', '999999'];

        for (const testId of testIds) {
          service.updateMealPlan.mockResolvedValue({
            ...expectedResponse,
            mealPlanId: testId,
          });

          const result = await controller.updateMealPlan(testId, updateMealPlanDto);

          expect(service.updateMealPlan).toHaveBeenCalledWith(
            testId,
            updateMealPlanDto,
            mockUserId,
          );
          expect(result.mealPlanId).toBe(testId);
        }
      });
    });
  });

  describe('DELETE /meal-plans/:id (deleteMealPlan)', () => {
    const mockMealPlanId = '123';
    const mockUserId = 'temp-user-id';

    beforeEach(() => {
      service.deleteMealPlan.mockClear();
    });

    describe('successful deletion', () => {
      it('should delete a meal plan successfully', async () => {
        service.deleteMealPlan.mockResolvedValue(undefined);

        const result = await controller.deleteMealPlan(mockMealPlanId);

        expect(service.deleteMealPlan).toHaveBeenCalledWith(mockMealPlanId, mockUserId);
        expect(result).toBeUndefined();
      });

      it('should work with different meal plan ID formats', async () => {
        const testIds = ['1', '123', '999999', '9999999999999'];

        for (const testId of testIds) {
          service.deleteMealPlan.mockClear();
          service.deleteMealPlan.mockResolvedValue(undefined);

          const result = await controller.deleteMealPlan(testId);

          expect(service.deleteMealPlan).toHaveBeenCalledWith(testId, mockUserId);
          expect(result).toBeUndefined();
        }
      });
    });

    describe('error handling', () => {
      it('should handle meal plan not found', async () => {
        const error = new Error('Meal plan with ID 999 not found');
        error.name = 'NotFoundException';
        service.deleteMealPlan.mockRejectedValue(error);

        await expect(controller.deleteMealPlan('999')).rejects.toThrow(error);
        expect(service.deleteMealPlan).toHaveBeenCalledWith('999', mockUserId);
      });

      it('should handle forbidden access (user does not own meal plan)', async () => {
        const error = new Error('You do not have permission to delete this meal plan');
        error.name = 'ForbiddenException';
        service.deleteMealPlan.mockRejectedValue(error);

        await expect(controller.deleteMealPlan(mockMealPlanId)).rejects.toThrow(error);
        expect(service.deleteMealPlan).toHaveBeenCalledWith(mockMealPlanId, mockUserId);
      });

      it('should handle invalid meal plan ID format', async () => {
        const error = new Error('Invalid meal plan ID format');
        error.name = 'BadRequestException';
        service.deleteMealPlan.mockRejectedValue(error);

        await expect(controller.deleteMealPlan('invalid-id')).rejects.toThrow(error);
      });

      it('should handle database errors during deletion', async () => {
        const error = new Error('Failed to delete meal plan');
        error.name = 'BadRequestException';
        service.deleteMealPlan.mockRejectedValue(error);

        await expect(controller.deleteMealPlan(mockMealPlanId)).rejects.toThrow(error);
        expect(service.deleteMealPlan).toHaveBeenCalledWith(mockMealPlanId, mockUserId);
      });

      it('should handle general service errors', async () => {
        const error = new Error('Internal server error');
        error.name = 'InternalServerErrorException';
        service.deleteMealPlan.mockRejectedValue(error);

        await expect(controller.deleteMealPlan(mockMealPlanId)).rejects.toThrow(error);
      });

      it('should propagate service exceptions without modification', async () => {
        const customError = new Error('Custom service error');
        customError.name = 'CustomException';
        service.deleteMealPlan.mockRejectedValue(customError);

        await expect(controller.deleteMealPlan(mockMealPlanId)).rejects.toThrow(customError);
      });
    });

    describe('authentication context', () => {
      it('should pass correct user ID from temporary context', async () => {
        service.deleteMealPlan.mockResolvedValue(undefined);

        await controller.deleteMealPlan(mockMealPlanId);

        expect(service.deleteMealPlan).toHaveBeenCalledWith(mockMealPlanId, 'temp-user-id');
      });
    });

    describe('parameter validation', () => {
      it('should accept various ID formats without validation errors', async () => {
        const testCases = [
          '1', // simple number
          '123456789', // larger number
          '000123', // padded number
          'abc123', // alphanumeric (if supported)
        ];

        for (const testId of testCases) {
          service.deleteMealPlan.mockClear();
          service.deleteMealPlan.mockResolvedValue(undefined);

          await controller.deleteMealPlan(testId);

          expect(service.deleteMealPlan).toHaveBeenCalledWith(testId, mockUserId);
        }
      });
    });

    describe('response format', () => {
      it('should return undefined/void for successful deletion', async () => {
        service.deleteMealPlan.mockResolvedValue(undefined);

        const result = await controller.deleteMealPlan(mockMealPlanId);

        expect(result).toBeUndefined();
      });

      it('should not return any data on successful deletion', async () => {
        service.deleteMealPlan.mockResolvedValue(undefined);

        const result = await controller.deleteMealPlan(mockMealPlanId);

        expect(result).not.toBeDefined();
      });
    });
  });
});
