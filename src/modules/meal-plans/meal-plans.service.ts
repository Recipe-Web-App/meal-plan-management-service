import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  MealPlansRepository,
  RecipeFilters,
  CreateMealPlanData,
  UpdateMealPlanData,
} from './meal-plans.repository';
import { MealPlanTagsRepository } from './meal-plan-tags.repository';
import { MealPlanValidationService } from './services/meal-plan-validation.service';
import {
  MealPlanQueryDto,
  PaginationDto,
  MealPlanByIdQueryDto,
  PaginatedMealPlansResponseDto,
  MealPlanQueryResponseDto,
  MealPlanResponseDto,
  DayViewResponseDto,
  WeekViewResponseDto,
  MonthViewResponseDto,
  MealPlanStatisticsDto,
  MealTypeBreakdownDto,
  CreateMealPlanDto,
  UpdateMealPlanDto,
} from './dto';
import { MealType } from '@generated/prisma/client';
import { RawMealPlanInput } from './types/validation.types';

export interface MealPlanFilters {
  userId?: string;
  isActive?: boolean;
  startDateFrom?: Date;
  endDateTo?: Date;
  nameSearch?: string;
  descriptionSearch?: string;
  includeRecipes?: boolean;
  includeArchived?: boolean;
}

export interface EnhancedMealPlanFilters extends MealPlanFilters {
  includeRecipes?: boolean;
}

export interface MealPlanSorting {
  sortBy: 'name' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface MealPlanWithRecipesData {
  mealPlanId: bigint;
  name: string;
  description?: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive?: boolean;
  mealPlanRecipes?: MealPlanRecipeData[];
}

export interface MealPlanRecipeData {
  mealPlanId: bigint;
  recipeId: bigint;
  mealDate: Date;
  mealType: MealType;
  servings?: number;
  recipe?: RecipeData;
}

export interface RecipeData {
  recipeId: bigint;
  title: string;
  userId: string;
  description?: string;
  cookTime?: number;
  prepTime?: number;
  servings?: number;
}

export interface MealCounts {
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
  dessert: number;
}

@Injectable()
export class MealPlansService {
  constructor(
    private readonly repository: MealPlansRepository,
    private readonly validationService: MealPlanValidationService,
    private readonly tagsRepository: MealPlanTagsRepository,
  ) {}

  async createMealPlan(
    createMealPlanDto: CreateMealPlanDto,
    userId: string,
  ): Promise<MealPlanResponseDto> {
    // Validate and sanitize the input data
    const validationResult = await this.validationService.validateCreateMealPlan(
      createMealPlanDto as RawMealPlanInput,
      { userId },
    );

    if (!validationResult.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validationResult.errors,
      });
    }

    try {
      // Create the meal plan
      const createData: CreateMealPlanData = {
        userId,
        name: validationResult.sanitizedData!.name,
        startDate: validationResult.sanitizedData!.startDate,
        endDate: validationResult.sanitizedData!.endDate,
      };

      // Only add description if it exists
      if (validationResult.sanitizedData!.description) {
        createData.description = validationResult.sanitizedData!.description;
      }

      const mealPlan = await this.repository.create(createData);

      // If recipes are provided, add them to the meal plan
      if (createMealPlanDto.recipes && createMealPlanDto.recipes.length > 0) {
        for (const recipe of createMealPlanDto.recipes) {
          // Convert day number to actual date within the meal plan range
          const mealDate = this.calculateMealDateFromDay(
            recipe.day,
            mealPlan.startDate,
            mealPlan.endDate,
          );

          await this.repository.addRecipeToMealPlan({
            mealPlanId: mealPlan.mealPlanId,
            recipeId: BigInt(recipe.recipeId),
            mealDate,
            mealType: recipe.mealType as MealType,
          });
        }
      }

      // If tags are provided, add them to the meal plan
      if (createMealPlanDto.tags && createMealPlanDto.tags.length > 0) {
        const tags = await this.tagsRepository.findOrCreateTagsByName(createMealPlanDto.tags);
        const tagIds = tags.map((tag) => tag.tagId);
        await this.tagsRepository.addTagsToMealPlan(mealPlan.mealPlanId, tagIds);
      }

      // Return the created meal plan with recipes and tags if they were added
      const createdMealPlan = await this.repository.findByIdWithRecipes(mealPlan.mealPlanId);

      // Add tags to the response
      const tagsData = await this.tagsRepository.findTagsByMealPlanId(mealPlan.mealPlanId);
      const response = plainToInstance(MealPlanResponseDto, createdMealPlan, {
        excludeExtraneousValues: true,
      });
      response.tags = tagsData.map((tag) => ({
        tagId: tag.tagId.toString(),
        name: tag.name,
      }));

      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create meal plan');
    }
  }

  async updateMealPlan(
    mealPlanId: string,
    updateMealPlanDto: UpdateMealPlanDto,
    userId: string,
  ): Promise<MealPlanResponseDto> {
    // First, verify the meal plan exists and user has permission
    const existingMealPlan = await this.repository.findById(BigInt(mealPlanId));
    if (!existingMealPlan) {
      throw new NotFoundException(`Meal plan with ID ${mealPlanId} not found`);
    }

    // Check if user owns this meal plan
    if (existingMealPlan.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this meal plan');
    }

    // Set context fields for validation
    updateMealPlanDto.userId = userId;
    updateMealPlanDto.id = mealPlanId;

    // Validate and sanitize the update data
    const validationResult = await this.validationService.validateUpdateMealPlan(
      updateMealPlanDto as RawMealPlanInput,
      { userId, currentMealPlanId: mealPlanId },
    );

    if (!validationResult.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validationResult.errors,
      });
    }

    try {
      // Build update data with only provided fields
      const updateData: UpdateMealPlanData = {};

      if (validationResult.sanitizedData!.name !== undefined) {
        updateData.name = validationResult.sanitizedData!.name;
      }

      if (validationResult.sanitizedData!.description !== undefined) {
        updateData.description = validationResult.sanitizedData!.description;
      }

      if (validationResult.sanitizedData!.startDate !== undefined) {
        updateData.startDate = validationResult.sanitizedData!.startDate;
      }

      if (validationResult.sanitizedData!.endDate !== undefined) {
        updateData.endDate = validationResult.sanitizedData!.endDate;
      }

      // Handle tags update (replace semantics) - do this even if no other fields are updated
      if (updateMealPlanDto.tags !== undefined) {
        if (updateMealPlanDto.tags.length > 0) {
          const tags = await this.tagsRepository.findOrCreateTagsByName(updateMealPlanDto.tags);
          const tagIds = tags.map((tag) => tag.tagId);
          await this.tagsRepository.replaceTagsOnMealPlan(BigInt(mealPlanId), tagIds);
        } else {
          // Empty array means remove all tags
          await this.tagsRepository.replaceTagsOnMealPlan(BigInt(mealPlanId), []);
        }
      }

      // If no fields to update (excluding tags), just fetch and return the meal plan
      let mealPlanToReturn;
      if (Object.keys(updateData).length === 0) {
        mealPlanToReturn = existingMealPlan;
      } else {
        // Update the meal plan
        mealPlanToReturn = await this.repository.update(BigInt(mealPlanId), updateData);
      }

      // Build response with tags
      const response = plainToInstance(MealPlanResponseDto, mealPlanToReturn, {
        excludeExtraneousValues: true,
      });

      // Add tags to response
      const tagsData = await this.tagsRepository.findTagsByMealPlanId(BigInt(mealPlanId));
      response.tags = tagsData.map((tag) => ({
        tagId: tag.tagId.toString(),
        name: tag.name,
      }));

      return response;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update meal plan');
    }
  }

  async deleteMealPlan(mealPlanId: string, userId: string): Promise<void> {
    // First, verify the meal plan exists and user has permission
    const existingMealPlan = await this.repository.findById(BigInt(mealPlanId));
    if (!existingMealPlan) {
      throw new NotFoundException(`Meal plan with ID ${mealPlanId} not found`);
    }

    // Check if user owns this meal plan
    if (existingMealPlan.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this meal plan');
    }

    try {
      // Delete the meal plan (Prisma will handle cascade deletion of recipes)
      await this.repository.delete(BigInt(mealPlanId));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete meal plan');
    }
  }

  async findMealPlans(
    queryDto: MealPlanQueryDto,
    paginationDto: PaginationDto,
    userId: string,
  ): Promise<PaginatedMealPlansResponseDto> {
    // Build filters from query DTO
    const filters = this.buildMealPlanFilters(queryDto, userId);
    const sorting = this.buildMealPlanSorting(queryDto);

    // Get total count for pagination
    const total = await this.repository.countMealPlans(filters);

    // Get paginated results
    const mealPlans = await this.repository.findManyWithFilters(filters, sorting, {
      skip: paginationDto.offset,
      take: paginationDto.limit!,
    });

    // Transform to response DTOs
    const mealPlanDtos = mealPlans.map((mealPlan) =>
      plainToInstance(MealPlanResponseDto, mealPlan, {
        excludeExtraneousValues: true,
      }),
    );

    // Build paginated response
    return {
      success: true,
      data: mealPlanDtos,
      meta: {
        page: paginationDto.page!,
        limit: paginationDto.limit!,
        total,
        totalPages: Math.ceil(total / paginationDto.limit!),
        hasNext: paginationDto.page! < Math.ceil(total / paginationDto.limit!),
        hasPrevious: paginationDto.page! > 1,
      },
    };
  }

  async findMealPlanById(
    id: string,
    queryDto: MealPlanByIdQueryDto,
    userId: string,
  ): Promise<MealPlanQueryResponseDto> {
    // Validate input parameters
    this.validateViewModeParams(queryDto);

    const mealPlanId = this.parseMealPlanId(id);

    // Verify meal plan exists and user has access
    await this.verifyMealPlanAccess(mealPlanId, userId);

    // Get meal plan with recipes if needed
    const mealPlan = queryDto.includeRecipes
      ? await this.repository.findByIdWithRecipesFiltered(
          mealPlanId,
          queryDto.mealType
            ? (() => {
                const filters: RecipeFilters = { mealType: queryDto.mealType };
                const dateRange = this.getDateRangeFromQuery(queryDto);
                if (dateRange) filters.dateRange = dateRange;
                return filters;
              })()
            : undefined,
        )
      : await this.repository.findById(mealPlanId);

    if (!mealPlan) {
      this.handleMealPlanNotFound(id);
    }

    // Transform based on view mode
    let responseData;
    const viewMode = queryDto.viewMode ?? 'full';

    switch (viewMode) {
      case 'full':
        responseData = this.transformToFullView(mealPlan);
        break;
      case 'day':
        responseData = this.transformToDayView(mealPlan, queryDto);
        break;
      case 'week':
        responseData = this.transformToWeekView(mealPlan, queryDto);
        break;
      case 'month':
        responseData = this.transformToMonthView(mealPlan, queryDto);
        break;
      default:
        responseData = this.transformToFullView(mealPlan);
    }

    // Add tags to the response for full view mode
    if (viewMode === 'full' || !viewMode) {
      const tagsData = await this.tagsRepository.findTagsByMealPlanId(mealPlanId);
      (responseData as MealPlanResponseDto).tags = tagsData.map((tag) => ({
        tagId: tag.tagId.toString(),
        name: tag.name,
      }));
    }

    const response: MealPlanQueryResponseDto = {
      success: true,
      viewMode,
      data: responseData,
    };

    // Add statistics if requested
    if (queryDto.includeStatistics) {
      response.statistics = await this.calculateStatistics(mealPlanId);
    }

    return response;
  }

  private buildMealPlanFilters(
    queryDto: MealPlanQueryDto,
    userId: string,
  ): EnhancedMealPlanFilters {
    const filters: EnhancedMealPlanFilters = {
      userId,
    };

    if (queryDto.isActive !== undefined) filters.isActive = queryDto.isActive;
    if (queryDto.startDateFrom !== undefined) filters.startDateFrom = queryDto.startDateFrom;
    if (queryDto.endDateTo !== undefined) filters.endDateTo = queryDto.endDateTo;
    if (queryDto.nameSearch !== undefined) filters.nameSearch = queryDto.nameSearch;
    if (queryDto.descriptionSearch !== undefined)
      filters.descriptionSearch = queryDto.descriptionSearch;
    if (queryDto.includeRecipes !== undefined) filters.includeRecipes = queryDto.includeRecipes;
    if (queryDto.includeArchived !== undefined) filters.includeArchived = queryDto.includeArchived;

    return filters;
  }

  private buildMealPlanSorting(queryDto: MealPlanQueryDto): MealPlanSorting {
    return {
      sortBy: queryDto.sortBy ?? 'createdAt',
      sortOrder: queryDto.sortOrder ?? 'desc',
    };
  }

  private parseMealPlanId(id: string): bigint {
    try {
      return BigInt(id);
    } catch {
      throw new NotFoundException(`Invalid meal plan ID: ${id}`);
    }
  }

  private getDateRangeFromQuery(
    queryDto: MealPlanByIdQueryDto,
  ): { startDate?: Date; endDate?: Date } | undefined {
    if (queryDto.filterDate) {
      return {
        startDate: queryDto.filterDate,
        endDate: queryDto.filterDate,
      };
    }

    if (queryDto.filterStartDate || queryDto.filterEndDate) {
      const dateRange: { startDate?: Date; endDate?: Date } = {};
      if (queryDto.filterStartDate) dateRange.startDate = queryDto.filterStartDate;
      if (queryDto.filterEndDate) dateRange.endDate = queryDto.filterEndDate;
      return dateRange;
    }

    if (queryDto.filterYear && queryDto.filterMonth) {
      const startDate = new Date(queryDto.filterYear, queryDto.filterMonth - 1, 1);
      const endDate = new Date(queryDto.filterYear, queryDto.filterMonth, 0);
      return { startDate, endDate };
    }

    return undefined;
  }

  private transformToFullView(mealPlan: MealPlanWithRecipesData): MealPlanResponseDto {
    return plainToInstance(MealPlanResponseDto, mealPlan, {
      excludeExtraneousValues: true,
    });
  }

  private transformToDayView(
    mealPlan: MealPlanWithRecipesData,
    queryDto: MealPlanByIdQueryDto,
  ): DayViewResponseDto {
    const targetDate = queryDto.filterDate ?? new Date();

    // Filter recipes for the specific day
    const dayRecipes =
      mealPlan.mealPlanRecipes?.filter((recipe: MealPlanRecipeData) => {
        const recipeDate = new Date(recipe.mealDate);
        return this.isSameDay(recipeDate, targetDate);
      }) ?? [];

    // Group by meal type
    const meals = this.groupRecipesByMealType(dayRecipes);

    return plainToInstance(
      DayViewResponseDto,
      {
        mealPlanId: mealPlan.mealPlanId.toString(),
        mealPlanName: mealPlan.name,
        date: targetDate,
        meals,
        totalMeals: dayRecipes.length,
      },
      { excludeExtraneousValues: true },
    );
  }

  private transformToWeekView(
    mealPlan: MealPlanWithRecipesData,
    queryDto: MealPlanByIdQueryDto,
  ): WeekViewResponseDto {
    const startDate = queryDto.filterStartDate ?? this.getWeekStart(new Date());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // Filter recipes for the week
    const weekRecipes =
      mealPlan.mealPlanRecipes?.filter((recipe: MealPlanRecipeData) => {
        const recipeDate = new Date(recipe.mealDate);
        return recipeDate >= startDate && recipeDate <= endDate;
      }) ?? [];

    // Create days structure
    const days = [];
    let totalMeals = 0;

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayRecipes = weekRecipes.filter((recipe: MealPlanRecipeData) => {
        const recipeDate = new Date(recipe.mealDate);
        return this.isSameDay(recipeDate, currentDate);
      });

      days.push({
        date: currentDate,
        dayOfWeek: this.getDayOfWeekName(currentDate),
        meals: this.groupRecipesByMealType(dayRecipes),
        totalMeals: dayRecipes.length,
      });

      totalMeals += dayRecipes.length;
    }

    return plainToInstance(
      WeekViewResponseDto,
      {
        mealPlanId: mealPlan.mealPlanId.toString(),
        mealPlanName: mealPlan.name,
        startDate,
        endDate,
        weekNumber: this.getWeekNumber(startDate),
        days,
        totalMeals,
      },
      { excludeExtraneousValues: true },
    );
  }

  private transformToMonthView(
    mealPlan: MealPlanWithRecipesData,
    queryDto: MealPlanByIdQueryDto,
  ): MonthViewResponseDto {
    const year = queryDto.filterYear ?? new Date().getFullYear();
    const month = queryDto.filterMonth ?? new Date().getMonth() + 1;

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    // Filter recipes for the month
    const monthRecipes =
      mealPlan.mealPlanRecipes?.filter((recipe: MealPlanRecipeData) => {
        const recipeDate = new Date(recipe.mealDate);
        return recipeDate >= monthStart && recipeDate <= monthEnd;
      }) ?? [];

    // Build month structure (simplified for now)
    const weeks = this.buildMonthWeeks(year, month, monthRecipes);
    const totalMeals = monthRecipes.length;

    return plainToInstance(
      MonthViewResponseDto,
      {
        mealPlanId: mealPlan.mealPlanId.toString(),
        mealPlanName: mealPlan.name,
        year,
        month,
        monthName: this.getMonthName(month),
        weeks,
        totalMeals,
      },
      { excludeExtraneousValues: true },
    );
  }

  private async calculateStatistics(mealPlanId: bigint): Promise<MealPlanStatisticsDto> {
    const stats = await this.repository.getMealPlanStatistics(mealPlanId);

    // Calculate start and end dates from unique dates
    const startDate = stats.uniqueDates.length > 0 ? stats.uniqueDates[0] : new Date();
    const endDate =
      stats.uniqueDates.length > 0 ? stats.uniqueDates[stats.uniqueDates.length - 1] : new Date();

    if (stats.totalRecipes === 0) {
      return plainToInstance(MealPlanStatisticsDto, {
        averageRecipesPerDay: 0,
        totalRecipes: 0,
        totalMealTypes: 0,
        mealTypeBreakdown: {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          snack: 0,
          dessert: 0,
        },
        startDate,
        endDate,
        duration: 1,
      });
    }

    // Convert meal type counts to breakdown format
    const mealTypeBreakdown = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
      dessert: 0,
    };

    stats.mealTypeCounts.forEach(({ mealType, count }) => {
      const key = mealType.toLowerCase() as keyof typeof mealTypeBreakdown;
      if (Object.hasOwn(mealTypeBreakdown, key)) {
        mealTypeBreakdown[key] = count;
      }
    });

    // Calculate average meals per day
    const averageMealsPerDay =
      stats.daysWithMeals > 0 ? stats.totalRecipes / stats.daysWithMeals : 0;

    return plainToInstance(
      MealPlanStatisticsDto,
      {
        averageRecipesPerDay: Math.round(averageMealsPerDay * 100) / 100,
        totalRecipes: stats.totalRecipes,
        totalMealTypes: Object.keys(mealTypeBreakdown).filter(
          (key) => mealTypeBreakdown[key as keyof typeof mealTypeBreakdown] > 0,
        ).length,
        mealTypeBreakdown: plainToInstance(MealTypeBreakdownDto, mealTypeBreakdown),
        startDate,
        endDate,
        duration:
          endDate && startDate
            ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 0,
      },
      { excludeExtraneousValues: true },
    );
  }

  // Utility methods
  private groupRecipesByMealType(
    recipes: MealPlanRecipeData[],
  ): Record<string, MealPlanRecipeData[]> {
    const grouped: Record<string, MealPlanRecipeData[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
      dessert: [],
    };

    recipes.forEach((recipe) => {
      const mealType = recipe.mealType.toLowerCase();
      if (grouped[mealType]) {
        grouped[mealType].push(recipe);
      }
    });

    return grouped;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  private getDayOfWeekName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()] ?? 'Unknown';
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
    );
  }

  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1] ?? 'Unknown';
  }

  private buildMonthWeeks(year: number, month: number, recipes: MealPlanRecipeData[]) {
    const weeks = [];
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    // Get the first day of the first week (Monday before month start)
    const firstWeekStart = this.getWeekStart(monthStart);

    const currentDate = new Date(firstWeekStart);

    while (currentDate <= monthEnd) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekDays = [];

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);

        // Filter recipes for this specific day
        const dayRecipes = recipes.filter((recipe: MealPlanRecipeData) => {
          const recipeDate = new Date(recipe.mealDate);
          return this.isSameDay(recipeDate, dayDate);
        });

        // Count meals by type for this day
        const mealCounts = {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          snack: 0,
          dessert: 0,
        };

        dayRecipes.forEach((recipe: MealPlanRecipeData) => {
          const mealType = recipe.mealType.toLowerCase();
          if (Object.hasOwn(mealCounts, mealType)) {
            mealCounts[mealType as keyof typeof mealCounts]++;
          }
        });

        weekDays.push({
          date: dayDate,
          dayOfMonth: dayDate.getDate(),
          isCurrentMonth: dayDate.getMonth() === month - 1,
          mealCount: dayRecipes.length,
          meals: mealCounts,
        });
      }

      weeks.push({
        weekNumber: this.getWeekNumber(weekStart),
        startDate: weekStart,
        endDate: weekEnd,
        days: weekDays,
      });

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);

      // Stop if we've covered the month and moved past it
      if (currentDate.getMonth() !== month - 1 && currentDate > monthEnd) {
        break;
      }
    }

    return weeks;
  }

  // Input Validation Helpers

  private validateViewModeParams(queryDto: MealPlanByIdQueryDto): void {
    const { viewMode, filterDate, filterStartDate, filterEndDate, filterYear, filterMonth } =
      queryDto;

    // Validate day view parameters
    if (viewMode === 'day' && !filterDate) {
      throw new BadRequestException('filterDate is required for day view mode');
    }

    // Validate week view parameters
    if (viewMode === 'week' && !filterStartDate) {
      throw new BadRequestException('filterStartDate is required for week view mode');
    }

    // Validate month view parameters
    if (viewMode === 'month') {
      if (!filterYear || !filterMonth) {
        throw new BadRequestException(
          'filterYear and filterMonth are required for month view mode',
        );
      }

      if (filterMonth < 1 || filterMonth > 12) {
        throw new BadRequestException('filterMonth must be between 1 and 12');
      }

      if (filterYear < 2020 || filterYear > 2100) {
        throw new BadRequestException('filterYear must be between 2020 and 2100');
      }
    }

    // Validate date ranges
    if (filterStartDate && filterEndDate) {
      this.validateDateRanges(filterStartDate, filterEndDate);
    }
  }

  private validateDateRanges(startDate: Date, endDate: Date): void {
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    // Check if date range is reasonable (not more than 1 year)
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYearMs) {
      throw new BadRequestException('Date range cannot exceed one year');
    }
  }

  // Error Handling Helpers

  private handleMealPlanNotFound(id: string): never {
    throw new NotFoundException(`Meal plan with ID ${id} not found`);
  }

  private handleUnauthorizedAccess(mealPlanId: string, userId: string): never {
    throw new ForbiddenException(`Access denied to meal plan ${mealPlanId} for user ${userId}`);
  }

  // Authorization Helpers

  private async verifyMealPlanAccess(mealPlanId: bigint, userId: string): Promise<void> {
    const exists = await this.repository.checkMealPlanExists(mealPlanId);
    if (!exists) {
      this.handleMealPlanNotFound(mealPlanId.toString());
    }

    const hasAccess = await this.repository.verifyMealPlanOwnership(mealPlanId, userId);
    if (!hasAccess) {
      this.handleUnauthorizedAccess(mealPlanId.toString(), userId);
    }
  }

  // Enhanced Utility Methods

  private async getRecipesForViewMode(
    mealPlanId: bigint,
    queryDto: MealPlanByIdQueryDto,
  ): Promise<MealPlanRecipeData[]> {
    const { viewMode, mealType } = queryDto;
    const filters: RecipeFilters = mealType ? { mealType } : {};

    switch (viewMode) {
      case 'day':
        if (queryDto.filterDate) {
          return this.repository.findRecipesForDateRange(
            mealPlanId,
            queryDto.filterDate,
            queryDto.filterDate,
            filters,
          );
        }
        break;

      case 'week':
        if (queryDto.filterStartDate) {
          return this.repository.findRecipesForWeek(mealPlanId, queryDto.filterStartDate, filters);
        }
        break;

      case 'month':
        if (queryDto.filterYear && queryDto.filterMonth) {
          return this.repository.findRecipesForMonth(
            mealPlanId,
            queryDto.filterYear,
            queryDto.filterMonth,
            filters,
          );
        }
        break;

      default: {
        // For full view, get all recipes with optional date range
        const dateRange = this.getDateRangeFromQuery(queryDto);
        if (dateRange) {
          return this.repository.findRecipesForDateRange(
            mealPlanId,
            dateRange.startDate!,
            dateRange.endDate!,
            filters,
          );
        }
        break;
      }
    }

    return [];
  }

  private handleRecipeGrouping(
    recipes: MealPlanRecipeData[],
    groupByMealType: boolean,
  ): MealPlanRecipeData[] | Record<string, MealPlanRecipeData[]> {
    if (groupByMealType) {
      return this.groupRecipesByMealType(recipes);
    }
    return recipes;
  }

  /**
   * Converts a day number (1-7) to an actual date within the meal plan's date range
   */
  private calculateMealDateFromDay(
    day: number,
    startDate: Date | null,
    endDate: Date | null,
  ): Date {
    if (!startDate) {
      throw new BadRequestException('Meal plan must have a start date to add recipes by day');
    }

    // Calculate the date based on the day number (1 = first day of meal plan)
    const mealDate = new Date(startDate);
    mealDate.setDate(startDate.getDate() + (day - 1));

    // Validate that the calculated date is within the meal plan range
    if (endDate && mealDate > endDate) {
      throw new BadRequestException(
        `Day ${day} is outside the meal plan date range (${startDate.toDateString()} to ${endDate.toDateString()})`,
      );
    }

    return mealDate;
  }
}
