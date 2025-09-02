import { Test, TestingModule } from '@nestjs/testing';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';
import {
  MealPlanQueryDto,
  PaginationDto,
  MealPlanByIdQueryDto,
  PaginatedMealPlansResponseDto,
  MealPlanQueryResponseDto,
} from './dto';
import { MealType } from './enums/meal-type.enum';

describe('MealPlansController', () => {
  let controller: MealPlansController;
  let service: jest.Mocked<MealPlansService>;

  const mockService = {
    findMealPlans: jest.fn(),
    findMealPlanById: jest.fn(),
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
});
