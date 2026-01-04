import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MealPlanFavoritesService } from './meal-plan-favorites.service';
import type { FavoritesSortBy, SortOrder } from './meal-plan-favorites.service';
import {
  PaginationDto,
  PaginatedMealPlanFavoritesResponseDto,
  MealPlanFavoriteApiResponseDto,
  MealPlanFavoriteCheckApiResponseDto,
  ErrorResponseDto,
} from './dto';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/jwt-payload.interface';

@ApiTags('favorites')
@Controller('meal-plan-management/meal-plans/favorites')
@ApiBearerAuth('JWT-Auth')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class MealPlanFavoritesController {
  constructor(private readonly favoritesService: MealPlanFavoritesService) {}

  @Get()
  @ApiOperation({
    summary: 'List favorite meal plans',
    description: "Retrieve a paginated list of the authenticated user's favorite meal plans",
    operationId: 'listFavoriteMealPlans',
  })
  @ApiResponse({
    status: 200,
    description: 'List of favorite meal plans retrieved successfully',
    type: PaginatedMealPlanFavoritesResponseDto,
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
    name: 'includeMealPlan',
    required: false,
    description: 'Include full meal plan details in response',
    type: Boolean,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
    enum: ['favoritedAt', 'mealPlanId'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  async listFavorites(
    @Query() paginationDto: PaginationDto,
    @Query('includeMealPlan') includeMealPlan?: string,
    @Query('sortBy') sortBy?: FavoritesSortBy,
    @Query('sortOrder') sortOrder?: SortOrder,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<PaginatedMealPlanFavoritesResponseDto> {
    const userId = user!.id;
    const includeDetails = includeMealPlan === 'true';
    return this.favoritesService.listFavorites(
      userId,
      paginationDto,
      includeDetails,
      sortBy ?? 'favoritedAt',
      sortOrder ?? 'desc',
    );
  }

  @Post(':mealPlanId')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Add meal plan to favorites',
    description: "Add a meal plan to the authenticated user's favorites",
    operationId: 'addMealPlanToFavorites',
  })
  @ApiParam({
    name: 'mealPlanId',
    description: 'Meal plan ID to add to favorites',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Meal plan added to favorites successfully',
    type: MealPlanFavoriteApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid meal plan ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Meal plan not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - meal plan already in favorites',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async addFavorite(
    @Param('mealPlanId') mealPlanId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MealPlanFavoriteApiResponseDto> {
    const userId = user.id;
    return this.favoritesService.addFavorite(userId, mealPlanId);
  }

  @Get(':mealPlanId')
  @ApiOperation({
    summary: 'Check if meal plan is favorited',
    description: "Check if a specific meal plan is in the authenticated user's favorites",
    operationId: 'checkMealPlanFavorite',
  })
  @ApiParam({
    name: 'mealPlanId',
    description: 'Meal plan ID to check',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Favorite status retrieved successfully',
    type: MealPlanFavoriteCheckApiResponseDto,
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
  async checkFavorite(
    @Param('mealPlanId') mealPlanId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MealPlanFavoriteCheckApiResponseDto> {
    const userId = user.id;
    return this.favoritesService.checkFavorite(userId, mealPlanId);
  }

  @Delete(':mealPlanId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Remove meal plan from favorites',
    description: "Remove a meal plan from the authenticated user's favorites",
    operationId: 'removeMealPlanFromFavorites',
  })
  @ApiParam({
    name: 'mealPlanId',
    description: 'Meal plan ID to remove from favorites',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Meal plan removed from favorites successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Favorite not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async removeFavorite(
    @Param('mealPlanId') mealPlanId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const userId = user.id;
    await this.favoritesService.removeFavorite(userId, mealPlanId);
  }
}
