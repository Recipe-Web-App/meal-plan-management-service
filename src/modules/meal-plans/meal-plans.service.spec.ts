import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MealPlansService } from './meal-plans.service';
import { MealPlansRepository } from './meal-plans.repository';
import { MealPlanValidationService } from './services/meal-plan-validation.service';
import { MealPlanQueryDto, PaginationDto, MealPlanByIdQueryDto } from './dto';
import { MealType } from './enums/meal-type.enum';

describe('MealPlansService', () => {
  let service: MealPlansService;
  let repository: jest.Mocked<MealPlansRepository>;

  const mockRepository = {
    findManyWithFilters: jest.fn(),
    countMealPlans: jest.fn(),
    findById: jest.fn(),
    findByIdWithRecipesFiltered: jest.fn(),
    verifyMealPlanOwnership: jest.fn(),
    getMealPlanStatistics: jest.fn(),
    checkMealPlanExists: jest.fn(),
    findRecipesForDateRange: jest.fn(),
    findRecipesForWeek: jest.fn(),
    findRecipesForMonth: jest.fn(),
  };

  const mockValidationService = {
    validateMealPlanAccess: jest.fn(),
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
        mealPlanRecipeId: BigInt(1),
        mealPlanId: BigInt(123),
        recipeId: BigInt(456),
        mealDate: new Date('2024-03-15'),
        mealType: 'BREAKFAST',
        servings: 4,
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date(),
        recipe: {
          recipeId: BigInt(456),
          title: 'Test Recipe',
          userId: 'test-user-id',
        },
      },
    ],
  };

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<MealPlansService>(MealPlansService);
    repository = module.get(MealPlansRepository);
    validationService = module.get(MealPlanValidationService);

    jest.clearAllMocks();
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

      await expect(
        service['verifyMealPlanAccess'](BigInt(123), 'test-user-id'),
      ).resolves.not.toThrow();
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
          { mealType: 'BREAKFAST', count: 5 },
          { mealType: 'LUNCH', count: 3 },
          { mealType: 'DINNER', count: 2 },
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
          mealPlanRecipeId: BigInt(1),
          mealPlanId: BigInt(123),
          recipeId: BigInt(456),
          mealDate: new Date('2024-03-15'),
          mealType: 'BREAKFAST' as any,
          servings: 2,
        },
        {
          mealPlanRecipeId: BigInt(2),
          mealPlanId: BigInt(123),
          recipeId: BigInt(789),
          mealDate: new Date('2024-03-15'),
          mealType: 'LUNCH' as any,
          servings: 1,
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
          mealDate: new Date('2024-03-15'),
          mealType: 'BREAKFAST' as any,
        },
      ];
      const result = service['buildMonthWeeks'](2024, 3, recipes);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('weekNumber');
      expect(result[0]).toHaveProperty('days');
      expect(result[0].days).toHaveLength(7);
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
        mealTypeCounts: [{ mealType: 'BREAKFAST', count: 5 }],
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
