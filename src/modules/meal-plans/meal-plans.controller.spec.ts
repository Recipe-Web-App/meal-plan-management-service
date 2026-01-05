import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
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
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

describe('MealPlansController', () => {
  let controller: MealPlansController;
  let service: {
    findMealPlans: Mock<(...args: unknown[]) => unknown>;
    findMealPlanById: Mock<(...args: unknown[]) => unknown>;
    createMealPlan: Mock<(...args: unknown[]) => unknown>;
    updateMealPlan: Mock<(...args: unknown[]) => unknown>;
    deleteMealPlan: Mock<(...args: unknown[]) => unknown>;
    getTrendingMealPlans: Mock<(...args: unknown[]) => unknown>;
  };

  const mockService = {
    findMealPlans: mock(() => {}),
    findMealPlanById: mock(() => {}),
    createMealPlan: mock(() => {}),
    updateMealPlan: mock(() => {}),
    deleteMealPlan: mock(() => {}),
    getTrendingMealPlans: mock(() => {}),
  };

  const mockPaginatedResponse: PaginatedMealPlansResponseDto = {
    success: true,
    data: [
      {
        id: '123',
        name: 'Test Meal Plan',
        description: 'Test Description',
        userId: 'test-user-id',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-07'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    meta: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  };

  const mockMealPlanResponse: MealPlanQueryResponseDto = {
    success: true,
    viewMode: 'full',
    data: {
      id: '123',
      name: 'Test Meal Plan',
      description: 'Test Description',
      userId: 'test-user-id',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-07'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockUser: AuthenticatedUser = {
    id: 'temp-user-id',
    sub: 'temp-user-id',
    clientId: 'test-client',
    scopes: ['read', 'write'],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  beforeEach(async () => {
    // Reset all mocks
    mockService.findMealPlans.mockReset();
    mockService.findMealPlanById.mockReset();
    mockService.createMealPlan.mockReset();
    mockService.updateMealPlan.mockReset();
    mockService.deleteMealPlan.mockReset();
    mockService.getTrendingMealPlans.mockReset();

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
      offset: 0,
    };

    it('should return paginated meal plans', async () => {
      service.findMealPlans.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.listMealPlans(queryDto, paginationDto, mockUser);

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findMealPlans).toHaveBeenCalledWith(
        queryDto,
        paginationDto,
        'temp-user-id', // Current temporary user ID
      );
    });

    it('should handle empty query parameters', async () => {
      const emptyQuery: MealPlanQueryDto = {};
      const defaultPagination: PaginationDto = { page: 1, limit: 20, offset: 0 };

      service.findMealPlans.mockResolvedValue({
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      });

      const result = await controller.listMealPlans(emptyQuery, defaultPagination, mockUser);

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

      await controller.listMealPlans(filterQuery, paginationDto, mockUser);

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

      const result = await controller.getMealPlanById('123', queryDto, mockUser);

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

      await controller.getMealPlanById('123', dayQuery, mockUser);

      expect(service.findMealPlanById).toHaveBeenCalledWith('123', dayQuery, 'temp-user-id');
    });

    it('should handle week view mode', async () => {
      const weekQuery: MealPlanByIdQueryDto = {
        viewMode: 'week',
        filterStartDate: new Date('2024-03-11'),
        includeRecipes: true,
      };

      service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

      await controller.getMealPlanById('123', weekQuery, mockUser);

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

      await controller.getMealPlanById('123', monthQuery, mockUser);

      expect(service.findMealPlanById).toHaveBeenCalledWith('123', monthQuery, 'temp-user-id');
    });

    it('should handle meal type filtering', async () => {
      const filteredQuery: MealPlanByIdQueryDto = {
        viewMode: 'full',
        mealType: MealType.DINNER,
        includeRecipes: true,
      };

      service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

      await controller.getMealPlanById('123', filteredQuery, mockUser);

      expect(service.findMealPlanById).toHaveBeenCalledWith('123', filteredQuery, 'temp-user-id');
    });
  });

  describe('getTrendingMealPlans', () => {
    const paginationDto: PaginationDto = {
      page: 1,
      limit: 20,
      offset: 0,
    };

    const mockTrendingResponse: PaginatedMealPlansResponseDto = {
      success: true,
      data: [
        {
          id: '123',
          name: 'Trending Meal Plan',
          description: 'A popular meal plan',
          userId: 'test-user-id',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-07'),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };

    it('should return paginated trending meal plans', async () => {
      service.getTrendingMealPlans.mockResolvedValue(mockTrendingResponse);

      const result = await controller.getTrendingMealPlans(paginationDto);

      expect(service.getTrendingMealPlans).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(mockTrendingResponse);
    });

    it('should handle empty results', async () => {
      const emptyResponse: PaginatedMealPlansResponseDto = {
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };

      service.getTrendingMealPlans.mockResolvedValue(emptyResponse);

      const result = await controller.getTrendingMealPlans(paginationDto);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should handle custom pagination parameters', async () => {
      const customPagination: PaginationDto = {
        page: 2,
        limit: 10,
        offset: 10,
      };

      const page2Response: PaginatedMealPlansResponseDto = {
        ...mockTrendingResponse,
        meta: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true,
        },
      };

      service.getTrendingMealPlans.mockResolvedValue(page2Response);

      const result = await controller.getTrendingMealPlans(customPagination);

      expect(service.getTrendingMealPlans).toHaveBeenCalledWith(customPagination);
      expect(result.meta.page).toBe(2);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrevious).toBe(true);
    });

    it('should handle maximum results (100 cap)', async () => {
      const maxPagination: PaginationDto = {
        page: 1,
        limit: 100,
        offset: 0,
      };

      const maxResponse: PaginatedMealPlansResponseDto = {
        ...mockTrendingResponse,
        meta: {
          page: 1,
          limit: 100,
          total: 100,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      service.getTrendingMealPlans.mockResolvedValue(maxResponse);

      const result = await controller.getTrendingMealPlans(maxPagination);

      expect(result.meta.total).toBe(100);
    });

    describe('error handling', () => {
      it('should handle service errors', async () => {
        const error = new Error('Database connection failed');
        error.name = 'InternalServerErrorException';
        service.getTrendingMealPlans.mockRejectedValue(error);

        expect(controller.getTrendingMealPlans(paginationDto)).rejects.toThrow(error);
      });

      it('should propagate BadRequestException from service', async () => {
        const error = new Error('Invalid pagination parameters');
        error.name = 'BadRequestException';
        service.getTrendingMealPlans.mockRejectedValue(error);

        expect(controller.getTrendingMealPlans(paginationDto)).rejects.toThrow(error);
      });
    });
  });

  describe('error scenarios', () => {
    describe('listMealPlans', () => {
      const queryDto: MealPlanQueryDto = {};
      const paginationDto: PaginationDto = { page: 1, limit: 20, offset: 0 };

      it('should throw NotFoundException when service throws NotFoundException', async () => {
        const error = new Error('Meal plans not found');
        error.name = 'NotFoundException';
        service.findMealPlans.mockRejectedValue(error);

        expect(controller.listMealPlans(queryDto, paginationDto, mockUser)).rejects.toThrow(error);
        expect(service.findMealPlans).toHaveBeenCalledWith(queryDto, paginationDto, 'temp-user-id');
      });

      it('should throw ForbiddenException when service throws ForbiddenException', async () => {
        const error = new Error('Access denied');
        error.name = 'ForbiddenException';
        service.findMealPlans.mockRejectedValue(error);

        expect(controller.listMealPlans(queryDto, paginationDto, mockUser)).rejects.toThrow(error);
      });

      it('should throw BadRequestException when service throws BadRequestException', async () => {
        const error = new Error('Invalid query parameters');
        error.name = 'BadRequestException';
        service.findMealPlans.mockRejectedValue(error);

        expect(controller.listMealPlans(queryDto, paginationDto, mockUser)).rejects.toThrow(error);
      });

      it('should throw InternalServerErrorException when service throws unexpected error', async () => {
        const error = new Error('Database connection failed');
        service.findMealPlans.mockRejectedValue(error);

        expect(controller.listMealPlans(queryDto, paginationDto, mockUser)).rejects.toThrow(error);
      });
    });

    describe('getMealPlanById', () => {
      const queryDto: MealPlanByIdQueryDto = { viewMode: 'full' };

      it('should throw NotFoundException when meal plan does not exist', async () => {
        const error = new Error('Meal plan with id "999" not found');
        error.name = 'NotFoundException';
        service.findMealPlanById.mockRejectedValue(error);

        expect(controller.getMealPlanById('999', queryDto, mockUser)).rejects.toThrow(error);
        expect(service.findMealPlanById).toHaveBeenCalledWith('999', queryDto, 'temp-user-id');
      });

      it('should throw ForbiddenException when user lacks access to meal plan', async () => {
        const error = new Error('Access denied to meal plan');
        error.name = 'ForbiddenException';
        service.findMealPlanById.mockRejectedValue(error);

        expect(controller.getMealPlanById('123', queryDto, mockUser)).rejects.toThrow(error);
      });

      it('should throw BadRequestException when meal plan ID is invalid', async () => {
        const error = new Error('Invalid meal plan ID format');
        error.name = 'BadRequestException';
        service.findMealPlanById.mockRejectedValue(error);

        expect(controller.getMealPlanById('invalid-id', queryDto, mockUser)).rejects.toThrow(error);
      });

      it('should throw BadRequestException when view mode parameters are invalid', async () => {
        const invalidQuery: MealPlanByIdQueryDto = { viewMode: 'day' }; // Missing required filterDate
        const error = new Error('Missing required filterDate for day view');
        error.name = 'BadRequestException';
        service.findMealPlanById.mockRejectedValue(error);

        expect(controller.getMealPlanById('123', invalidQuery, mockUser)).rejects.toThrow(error);
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

        expect(controller.getMealPlanById('123', invalidQuery, mockUser)).rejects.toThrow(error);
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

        expect(controller.getMealPlanById('123', invalidQuery, mockUser)).rejects.toThrow(error);
      });

      it('should handle database timeout errors', async () => {
        const error = new Error('Database operation timed out');
        error.name = 'TimeoutError';
        service.findMealPlanById.mockRejectedValue(error);

        expect(controller.getMealPlanById('123', queryDto, mockUser)).rejects.toThrow(error);
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    describe('listMealPlans', () => {
      it('should handle maximum pagination limit', async () => {
        const queryDto: MealPlanQueryDto = {};
        const maxPagination: PaginationDto = { page: 1, limit: 100, offset: 0 }; // Assuming max limit

        service.findMealPlans.mockResolvedValue({
          success: true,
          data: [],
          meta: {
            page: 1,
            limit: 100,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        });

        const result = await controller.listMealPlans(queryDto, maxPagination, mockUser);

        expect(result.meta.limit).toBe(100);
        expect(service.findMealPlans).toHaveBeenCalledWith(queryDto, maxPagination, 'temp-user-id');
      });

      it('should handle very large page numbers', async () => {
        const queryDto: MealPlanQueryDto = {};
        const largePagination: PaginationDto = { page: 1000, limit: 20, offset: 19980 };

        service.findMealPlans.mockResolvedValue({
          success: true,
          data: [],
          meta: {
            page: 1000,
            limit: 20,
            total: 5,
            totalPages: 1,
            hasNext: false,
            hasPrevious: true,
          },
        });

        const result = await controller.listMealPlans(queryDto, largePagination, mockUser);

        expect(result.meta.page).toBe(1000);
        expect(result.data).toEqual([]);
      });

      it('should handle special characters in search terms', async () => {
        const queryDto: MealPlanQueryDto = {
          nameSearch: 'Mom\'s "Special" Recipe & More!',
          descriptionSearch: 'Test with @#$%^&*() symbols',
        };
        const paginationDto: PaginationDto = { page: 1, limit: 20, offset: 0 };

        service.findMealPlans.mockResolvedValue({
          success: true,
          data: [],
          meta: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        });

        await controller.listMealPlans(queryDto, paginationDto, mockUser);

        expect(service.findMealPlans).toHaveBeenCalledWith(queryDto, paginationDto, 'temp-user-id');
      });

      it('should handle extreme date ranges', async () => {
        const queryDto: MealPlanQueryDto = {
          startDateFrom: new Date('1900-01-01'),
          endDateTo: new Date('2100-12-31'),
        };
        const paginationDto: PaginationDto = { page: 1, limit: 20, offset: 0 };

        service.findMealPlans.mockResolvedValue({
          success: true,
          data: [],
          meta: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        });

        await controller.listMealPlans(queryDto, paginationDto, mockUser);

        expect(service.findMealPlans).toHaveBeenCalledWith(queryDto, paginationDto, 'temp-user-id');
      });
    });

    describe('getMealPlanById', () => {
      it('should handle very large meal plan IDs', async () => {
        const largeId = '999999999999999999'; // Very large ID
        const queryDto: MealPlanByIdQueryDto = { viewMode: 'full' };

        service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

        await controller.getMealPlanById(largeId, queryDto, mockUser);

        expect(service.findMealPlanById).toHaveBeenCalledWith(largeId, queryDto, 'temp-user-id');
      });

      it('should handle edge case dates for day view', async () => {
        const queryDto: MealPlanByIdQueryDto = {
          viewMode: 'day',
          filterDate: new Date('2000-02-29'), // Leap year edge case
        };

        service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

        await controller.getMealPlanById('123', queryDto, mockUser);

        expect(service.findMealPlanById).toHaveBeenCalledWith('123', queryDto, 'temp-user-id');
      });

      it('should handle year boundaries for month view', async () => {
        const queryDto: MealPlanByIdQueryDto = {
          viewMode: 'month',
          filterYear: 2024,
          filterMonth: 12, // December - year boundary
        };

        service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

        await controller.getMealPlanById('123', queryDto, mockUser);

        expect(service.findMealPlanById).toHaveBeenCalledWith('123', queryDto, 'temp-user-id');
      });

      it('should handle all meal types', async () => {
        for (const mealType of Object.values(MealType)) {
          const queryDto: MealPlanByIdQueryDto = {
            viewMode: 'full',
            mealType: mealType as MealType,
          };

          service.findMealPlanById.mockResolvedValue(mockMealPlanResponse);

          await controller.getMealPlanById('123', queryDto, mockUser);

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

        await controller.getMealPlanById('123', complexQuery, mockUser);

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
      id: '123',
      name: 'Test Meal Plan',
      description: 'A test meal plan description',
      userId: 'temp-user-id',
      startDate: new Date('2024-03-10'),
      endDate: new Date('2024-03-16'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      recipes: [],
    };

    it('should create a meal plan successfully', async () => {
      service.createMealPlan.mockResolvedValue(expectedResponse);

      const result = await controller.createMealPlan(createMealPlanDto, mockUser);

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

      const result = await controller.createMealPlan(simpleDto, mockUser);

      expect(service.createMealPlan).toHaveBeenCalledWith(simpleDto, 'temp-user-id');
      expect(result).toEqual(simpleResponse);
    });

    it('should create a meal plan with minimal data', async () => {
      const minimalDto: CreateMealPlanDto = {
        name: 'Minimal Meal Plan',
        startDate: new Date('2024-03-10'),
        endDate: new Date('2024-03-16'),
      } as any;

      const minimalResponse: MealPlanResponseDto = {
        ...expectedResponse,
        name: 'Minimal Meal Plan',
      };
      delete minimalResponse.description;

      service.createMealPlan.mockResolvedValue(minimalResponse);

      const result = await controller.createMealPlan(minimalDto, mockUser);

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

        expect(controller.createMealPlan(invalidDto, mockUser)).rejects.toThrow(error);
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

        expect(controller.createMealPlan(conflictDto, mockUser)).rejects.toThrow(error);
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

        expect(controller.createMealPlan(overlappingDto, mockUser)).rejects.toThrow(error);
      });

      it('should handle database errors', async () => {
        const error = new Error('Database connection failed');
        error.name = 'InternalServerErrorException';
        service.createMealPlan.mockRejectedValue(error);

        expect(controller.createMealPlan(createMealPlanDto, mockUser)).rejects.toThrow(error);
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

        const result = await controller.createMealPlan(multiRecipeDto, mockUser);

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

        expect(controller.createMealPlan(invalidRecipeDto, mockUser)).rejects.toThrow(error);
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

        expect(controller.createMealPlan(invalidDayDto, mockUser)).rejects.toThrow(error);
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
      id: '123',
      name: 'Updated Meal Plan',
      description: 'Updated description',
      userId: 'temp-user-id',
      startDate: new Date('2024-03-15T00:00:00.000Z'),
      endDate: new Date('2024-03-21T23:59:59.999Z'),
      isActive: true,
      createdAt: new Date('2024-03-01T00:00:00.000Z'),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      service.updateMealPlan.mockReset();
    });

    describe('successful updates', () => {
      it('should update a meal plan successfully with all fields', async () => {
        service.updateMealPlan.mockResolvedValue(expectedResponse);

        const result = await controller.updateMealPlan(mockMealPlanId, updateMealPlanDto, mockUser);

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

        const result = await controller.updateMealPlan(mockMealPlanId, partialUpdateDto, mockUser);

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

        const result = await controller.updateMealPlan(mockMealPlanId, nameOnlyDto, mockUser);

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

        const result = await controller.updateMealPlan(
          mockMealPlanId,
          descriptionOnlyDto,
          mockUser,
        );

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

        const result = await controller.updateMealPlan(mockMealPlanId, datesOnlyDto, mockUser);

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

        const result = await controller.updateMealPlan(mockMealPlanId, emptyDto, mockUser);

        expect(service.updateMealPlan).toHaveBeenCalledWith(mockMealPlanId, emptyDto, mockUserId);
        expect(result).toEqual(expectedResponse);
      });
    });

    describe('error handling', () => {
      it('should handle meal plan not found', async () => {
        const error = new Error('Meal plan with ID 999 not found');
        error.name = 'NotFoundException';
        service.updateMealPlan.mockRejectedValue(error);

        expect(controller.updateMealPlan('999', updateMealPlanDto, mockUser)).rejects.toThrow(
          error,
        );
      });

      it('should handle forbidden access (user does not own meal plan)', async () => {
        const error = new Error('You do not have permission to update this meal plan');
        error.name = 'ForbiddenException';
        service.updateMealPlan.mockRejectedValue(error);

        expect(
          controller.updateMealPlan(mockMealPlanId, updateMealPlanDto, mockUser),
        ).rejects.toThrow(error);
      });

      it('should handle validation errors', async () => {
        const invalidDto: UpdateMealPlanDto = {
          name: '', // Invalid: empty name
          description: 'a'.repeat(1001), // Invalid: too long
        };

        const error = new Error('Validation failed');
        error.name = 'BadRequestException';
        service.updateMealPlan.mockRejectedValue(error);

        expect(controller.updateMealPlan(mockMealPlanId, invalidDto, mockUser)).rejects.toThrow(
          error,
        );
      });

      it('should handle date overlap conflicts', async () => {
        const conflictDto: UpdateMealPlanDto = {
          startDate: new Date('2024-03-01T00:00:00.000Z'),
          endDate: new Date('2024-03-07T23:59:59.999Z'),
        };

        const error = new Error('Updated dates would overlap with existing meal plan');
        error.name = 'ConflictException';
        service.updateMealPlan.mockRejectedValue(error);

        expect(controller.updateMealPlan(mockMealPlanId, conflictDto, mockUser)).rejects.toThrow(
          error,
        );
      });

      it('should handle invalid date ranges', async () => {
        const invalidDateDto: UpdateMealPlanDto = {
          startDate: new Date('2024-03-07T00:00:00.000Z'),
          endDate: new Date('2024-03-01T23:59:59.999Z'), // End before start
        };

        const error = new Error('End date must be after start date');
        error.name = 'BadRequestException';
        service.updateMealPlan.mockRejectedValue(error);

        expect(controller.updateMealPlan(mockMealPlanId, invalidDateDto, mockUser)).rejects.toThrow(
          error,
        );
      });

      it('should handle general service errors', async () => {
        const error = new Error('Failed to update meal plan');
        error.name = 'BadRequestException';
        service.updateMealPlan.mockRejectedValue(error);

        expect(
          controller.updateMealPlan(mockMealPlanId, updateMealPlanDto, mockUser),
        ).rejects.toThrow(error);
      });
    });

    describe('parameter validation', () => {
      it('should work with different meal plan ID formats', async () => {
        const testIds = ['1', '123', '999999'];

        for (const testId of testIds) {
          service.updateMealPlan.mockResolvedValue({
            ...expectedResponse,
            id: testId,
          });

          const result = await controller.updateMealPlan(testId, updateMealPlanDto, mockUser);

          expect(service.updateMealPlan).toHaveBeenCalledWith(
            testId,
            updateMealPlanDto,
            mockUserId,
          );
          expect(result.id).toBe(testId);
        }
      });
    });
  });

  describe('DELETE /meal-plans/:id (deleteMealPlan)', () => {
    const mockMealPlanId = '123';
    const mockUserId = 'temp-user-id';

    beforeEach(() => {
      service.deleteMealPlan.mockReset();
    });

    describe('successful deletion', () => {
      it('should delete a meal plan successfully', async () => {
        service.deleteMealPlan.mockResolvedValue(undefined);

        const result = await controller.deleteMealPlan(mockMealPlanId, mockUser);

        expect(service.deleteMealPlan).toHaveBeenCalledWith(mockMealPlanId, mockUserId);
        expect(result).toBeUndefined();
      });

      it('should work with different meal plan ID formats', async () => {
        const testIds = ['1', '123', '999999', '9999999999999'];

        for (const testId of testIds) {
          service.deleteMealPlan.mockReset();
          service.deleteMealPlan.mockResolvedValue(undefined);

          const result = await controller.deleteMealPlan(testId, mockUser);

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

        expect(controller.deleteMealPlan('999', mockUser)).rejects.toThrow(error);
        expect(service.deleteMealPlan).toHaveBeenCalledWith('999', mockUserId);
      });

      it('should handle forbidden access (user does not own meal plan)', async () => {
        const error = new Error('You do not have permission to delete this meal plan');
        error.name = 'ForbiddenException';
        service.deleteMealPlan.mockRejectedValue(error);

        expect(controller.deleteMealPlan(mockMealPlanId, mockUser)).rejects.toThrow(error);
        expect(service.deleteMealPlan).toHaveBeenCalledWith(mockMealPlanId, mockUserId);
      });

      it('should handle invalid meal plan ID format', async () => {
        const error = new Error('Invalid meal plan ID format');
        error.name = 'BadRequestException';
        service.deleteMealPlan.mockRejectedValue(error);

        expect(controller.deleteMealPlan('invalid-id', mockUser)).rejects.toThrow(error);
      });

      it('should handle database errors during deletion', async () => {
        const error = new Error('Failed to delete meal plan');
        error.name = 'BadRequestException';
        service.deleteMealPlan.mockRejectedValue(error);

        expect(controller.deleteMealPlan(mockMealPlanId, mockUser)).rejects.toThrow(error);
        expect(service.deleteMealPlan).toHaveBeenCalledWith(mockMealPlanId, mockUserId);
      });

      it('should handle general service errors', async () => {
        const error = new Error('Internal server error');
        error.name = 'InternalServerErrorException';
        service.deleteMealPlan.mockRejectedValue(error);

        expect(controller.deleteMealPlan(mockMealPlanId, mockUser)).rejects.toThrow(error);
      });

      it('should propagate service exceptions without modification', async () => {
        const customError = new Error('Custom service error');
        customError.name = 'CustomException';
        service.deleteMealPlan.mockRejectedValue(customError);

        expect(controller.deleteMealPlan(mockMealPlanId, mockUser)).rejects.toThrow(customError);
      });
    });

    describe('authentication context', () => {
      it('should pass correct user ID from temporary context', async () => {
        service.deleteMealPlan.mockResolvedValue(undefined);

        await controller.deleteMealPlan(mockMealPlanId, mockUser);

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
          service.deleteMealPlan.mockReset();
          service.deleteMealPlan.mockResolvedValue(undefined);

          await controller.deleteMealPlan(testId, mockUser);

          expect(service.deleteMealPlan).toHaveBeenCalledWith(testId, mockUserId);
        }
      });
    });

    describe('response format', () => {
      it('should return undefined/void for successful deletion', async () => {
        service.deleteMealPlan.mockResolvedValue(undefined);

        const result = await controller.deleteMealPlan(mockMealPlanId, mockUser);

        expect(result).toBeUndefined();
      });

      it('should not return any data on successful deletion', async () => {
        service.deleteMealPlan.mockResolvedValue(undefined);

        const result = await controller.deleteMealPlan(mockMealPlanId, mockUser);

        expect(result).not.toBeDefined();
      });
    });
  });
});
