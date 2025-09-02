import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MealPlansService } from './meal-plans.service';
import {
  MealPlanQueryDto,
  PaginationDto,
  MealPlanByIdQueryDto,
  PaginatedMealPlansResponseDto,
  MealPlanQueryResponseDto,
  ErrorResponseDto,
  CreateMealPlanDto,
  UpdateMealPlanDto,
  MealPlanResponseDto,
} from './dto';
import { MEAL_TYPE_VALUES } from './enums/meal-type.enum';

// TODO: Implement JwtAuthGuard when authentication is ready
// import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
// import { CurrentUser } from '@/shared/decorators/current-user.decorator';

@ApiTags('meal-plans')
@Controller('api/v1/meal-plans')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
// @UseGuards(JwtAuthGuard) // TODO: Enable when authentication is ready
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  @Get()
  @ApiOperation({
    summary: 'List meal plans',
    description: 'Retrieve a paginated list of meal plans with optional filters',
    operationId: 'listMealPlans',
  })
  @ApiResponse({
    status: 200,
    description: 'List of meal plans retrieved successfully',
    type: PaginatedMealPlansResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID to filter by',
    type: String,
    format: 'uuid',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'startDateFrom',
    required: false,
    description: 'Filter meal plans starting from this date',
    type: String,
    format: 'date-time',
  })
  @ApiQuery({
    name: 'endDateTo',
    required: false,
    description: 'Filter meal plans ending before this date',
    type: String,
    format: 'date-time',
  })
  @ApiQuery({
    name: 'nameSearch',
    required: false,
    description: 'Search term for meal plan name',
    type: String,
  })
  @ApiQuery({
    name: 'descriptionSearch',
    required: false,
    description: 'Search term for meal plan description',
    type: String,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
    enum: ['name', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  @ApiQuery({
    name: 'includeRecipes',
    required: false,
    description: 'Include recipe details in response',
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeArchived',
    required: false,
    description: 'Include archived meal plans',
    type: Boolean,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
    example: 20,
  })
  async listMealPlans(
    @Query() queryDto: MealPlanQueryDto,
    @Query() paginationDto: PaginationDto,
    // @CurrentUser('userId') userId: string, // TODO: Enable when authentication is ready
  ): Promise<PaginatedMealPlansResponseDto> {
    // TODO: Replace with actual user ID from JWT token
    const userId = 'temp-user-id';

    return this.mealPlansService.findMealPlans(queryDto, paginationDto, userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new meal plan',
    description: 'Create a new meal plan with optional recipe assignments',
    operationId: 'createMealPlan',
  })
  @ApiBody({
    type: CreateMealPlanDto,
    description: 'Meal plan data to create',
  })
  @ApiResponse({
    status: 201,
    description: 'Meal plan created successfully',
    type: MealPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - meal plan with overlapping dates exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Stricter rate limiting for creation
  async createMealPlan(
    @Body() createMealPlanDto: CreateMealPlanDto,
    // @CurrentUser('userId') userId: string, // TODO: Enable when authentication is ready
  ): Promise<MealPlanResponseDto> {
    // TODO: Replace with actual user ID from JWT token
    const userId = 'temp-user-id';

    return this.mealPlansService.createMealPlan(createMealPlanDto, userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update an existing meal plan',
    description: 'Update a meal plan by ID with new data. Only provided fields will be updated.',
    operationId: 'updateMealPlan',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal plan ID to update',
    type: String,
    example: '123',
  })
  @ApiBody({
    type: UpdateMealPlanDto,
    description: 'Meal plan update data. All fields are optional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Meal plan updated successfully',
    type: MealPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or invalid data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this meal plan',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Meal plan not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - updated dates would overlap with existing meal plan',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // Moderate rate limiting for updates
  async updateMealPlan(
    @Param('id') id: string,
    @Body() updateMealPlanDto: UpdateMealPlanDto,
    // @CurrentUser('userId') userId: string, // TODO: Enable when authentication is ready
  ): Promise<MealPlanResponseDto> {
    // TODO: Replace with actual user ID from JWT token
    const userId = 'temp-user-id';

    return this.mealPlansService.updateMealPlan(id, updateMealPlanDto, userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get meal plan by ID',
    description: 'Retrieve a specific meal plan with flexible viewing options and filters',
    operationId: 'getMealPlanById',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal plan ID',
    type: String,
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Meal plan retrieved successfully',
    type: MealPlanQueryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Resource not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @ApiQuery({
    name: 'viewMode',
    required: false,
    description: 'How to structure the response data',
    enum: ['full', 'day', 'week', 'month'],
    example: 'full',
  })
  @ApiQuery({
    name: 'filterDate',
    required: false,
    description: 'For "day" view - specific date to retrieve',
    type: String,
    format: 'date',
    example: '2024-03-15',
  })
  @ApiQuery({
    name: 'filterStartDate',
    required: false,
    description: 'Start date for filtering (week view or custom range)',
    type: String,
    format: 'date',
  })
  @ApiQuery({
    name: 'filterEndDate',
    required: false,
    description: 'End date for custom date range filtering',
    type: String,
    format: 'date',
  })
  @ApiQuery({
    name: 'filterYear',
    required: false,
    description: 'Year for month view',
    type: Number,
    minimum: 2020,
    maximum: 2100,
    example: 2024,
  })
  @ApiQuery({
    name: 'filterMonth',
    required: false,
    description: 'Month number (1-12) for month view',
    type: Number,
    minimum: 1,
    maximum: 12,
    example: 3,
  })
  @ApiQuery({
    name: 'mealType',
    required: false,
    description: 'Filter results by meal type',
    enum: MEAL_TYPE_VALUES,
  })
  @ApiQuery({
    name: 'groupByMealType',
    required: false,
    description: 'Group results by meal type',
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeRecipes',
    required: false,
    description: 'Include full recipe details in response',
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeStatistics',
    required: false,
    description: 'Include meal statistics (useful for month view)',
    type: Boolean,
  })
  async getMealPlanById(
    @Param('id') id: string,
    @Query() queryDto: MealPlanByIdQueryDto,
    // @CurrentUser('userId') userId: string, // TODO: Enable when authentication is ready
  ): Promise<MealPlanQueryResponseDto> {
    // TODO: Replace with actual user ID from JWT token
    const userId = 'temp-user-id';

    return this.mealPlansService.findMealPlanById(id, queryDto, userId);
  }
}
