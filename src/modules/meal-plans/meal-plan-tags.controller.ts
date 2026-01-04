import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MealPlanTagsService } from './meal-plan-tags.service';
import type { TagsSortBy, SortOrder } from './meal-plan-tags.service';
import {
  PaginationDto,
  PaginatedTagsResponseDto,
  MealPlanTagsApiResponseDto,
  AddMealPlanTagsDto,
  ErrorResponseDto,
} from './dto';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/jwt-payload.interface';

@ApiTags('tags')
@Controller('meal-plan-management/meal-plans')
@ApiBearerAuth('JWT-Auth')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class MealPlanTagsController {
  constructor(private readonly tagsService: MealPlanTagsService) {}

  @Get('tags')
  @ApiOperation({
    summary: 'List all tags',
    description: 'Retrieve a paginated list of all available meal plan tags',
    operationId: 'listMealPlanTags',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tags retrieved successfully',
    type: PaginatedTagsResponseDto,
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
    name: 'nameSearch',
    required: false,
    description: 'Search term for tag name',
    type: String,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
    enum: ['name', 'tagId'],
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
  async listAllTags(
    @Query() paginationDto: PaginationDto,
    @Query('nameSearch') nameSearch?: string,
    @Query('sortBy') sortBy?: TagsSortBy,
    @Query('sortOrder') sortOrder?: SortOrder,
  ): Promise<PaginatedTagsResponseDto> {
    return this.tagsService.listAllTags(
      paginationDto,
      nameSearch,
      sortBy ?? 'name',
      sortOrder ?? 'asc',
    );
  }

  @Get(':id/tags')
  @ApiOperation({
    summary: 'Get meal plan tags',
    description: 'Retrieve all tags associated with a specific meal plan',
    operationId: 'getMealPlanTags',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal plan ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
    type: MealPlanTagsApiResponseDto,
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
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async getMealPlanTags(
    @Param('id') mealPlanId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MealPlanTagsApiResponseDto> {
    const userId = user.id;
    return this.tagsService.getMealPlanTags(userId, mealPlanId);
  }

  @Post(':id/tags')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Add tags to meal plan',
    description:
      'Add tags to a meal plan. This is additive - existing tags are kept. New tags are created if they do not exist.',
    operationId: 'addMealPlanTags',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal plan ID',
    type: String,
  })
  @ApiBody({
    type: AddMealPlanTagsDto,
    description: 'Tags to add',
  })
  @ApiResponse({
    status: 200,
    description: 'Tags added successfully',
    type: MealPlanTagsApiResponseDto,
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
    description: 'Meal plan not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async addTags(
    @Param('id') mealPlanId: string,
    @Body() dto: AddMealPlanTagsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MealPlanTagsApiResponseDto> {
    const userId = user.id;
    return this.tagsService.addTagsToMealPlan(userId, mealPlanId, dto);
  }

  @Put(':id/tags')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Replace meal plan tags',
    description:
      'Replace all tags on a meal plan. Existing tags are removed and replaced with the provided tags.',
    operationId: 'replaceMealPlanTags',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal plan ID',
    type: String,
  })
  @ApiBody({
    type: AddMealPlanTagsDto,
    description: 'Tags to set',
  })
  @ApiResponse({
    status: 200,
    description: 'Tags replaced successfully',
    type: MealPlanTagsApiResponseDto,
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
    description: 'Meal plan not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async replaceTags(
    @Param('id') mealPlanId: string,
    @Body() dto: AddMealPlanTagsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MealPlanTagsApiResponseDto> {
    const userId = user.id;
    return this.tagsService.replaceTagsOnMealPlan(userId, mealPlanId, dto);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Remove tag from meal plan',
    description: 'Remove a specific tag from a meal plan',
    operationId: 'removeMealPlanTag',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal plan ID',
    type: String,
  })
  @ApiParam({
    name: 'tagId',
    description: 'Tag ID to remove',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Tag removed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Meal plan or tag not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async removeTag(
    @Param('id') mealPlanId: string,
    @Param('tagId') tagId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const userId = user.id;
    await this.tagsService.removeTagFromMealPlan(userId, mealPlanId, tagId);
  }
}
