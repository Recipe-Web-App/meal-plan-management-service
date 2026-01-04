import { Module } from '@nestjs/common';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';
import { MealPlansRepository } from './meal-plans.repository';
import { MealPlanValidationService } from './services/meal-plan-validation.service';
import { MealPlanFavoritesController } from './meal-plan-favorites.controller';
import { MealPlanFavoritesService } from './meal-plan-favorites.service';
import { MealPlanFavoritesRepository } from './meal-plan-favorites.repository';

@Module({
  controllers: [MealPlansController, MealPlanFavoritesController],
  providers: [
    MealPlansService,
    MealPlansRepository,
    MealPlanValidationService,
    MealPlanFavoritesService,
    MealPlanFavoritesRepository,
  ],
  exports: [MealPlansService, MealPlansRepository],
})
export class MealPlansModule {}
