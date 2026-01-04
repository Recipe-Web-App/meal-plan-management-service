import { Module } from '@nestjs/common';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';
import { MealPlansRepository } from './meal-plans.repository';
import { MealPlanValidationService } from './services/meal-plan-validation.service';
import { MealPlanFavoritesController } from './meal-plan-favorites.controller';
import { MealPlanFavoritesService } from './meal-plan-favorites.service';
import { MealPlanFavoritesRepository } from './meal-plan-favorites.repository';
import { MealPlanTagsController } from './meal-plan-tags.controller';
import { MealPlanTagsService } from './meal-plan-tags.service';
import { MealPlanTagsRepository } from './meal-plan-tags.repository';

@Module({
  controllers: [MealPlansController, MealPlanFavoritesController, MealPlanTagsController],
  providers: [
    MealPlansService,
    MealPlansRepository,
    MealPlanValidationService,
    MealPlanFavoritesService,
    MealPlanFavoritesRepository,
    MealPlanTagsService,
    MealPlanTagsRepository,
  ],
  exports: [MealPlansService, MealPlansRepository, MealPlanTagsService, MealPlanTagsRepository],
})
export class MealPlansModule {}
