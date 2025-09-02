import { Module } from '@nestjs/common';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';
import { MealPlansRepository } from './meal-plans.repository';
import { MealPlanValidationService } from './services/meal-plan-validation.service';

@Module({
  controllers: [MealPlansController],
  providers: [MealPlansService, MealPlansRepository, MealPlanValidationService],
  exports: [MealPlansService, MealPlansRepository],
})
export class MealPlansModule {}
