import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import {
  MealPlanOverlapValidationArgs,
  TypedValidationArguments,
  DecoratorTarget,
  MealPlanWhereClause,
} from '../types/validator.types';

@ValidatorConstraint({ name: 'noOverlappingMealPlans', async: true })
@Injectable()
export class NoOverlappingMealPlansConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: unknown, args: TypedValidationArguments): Promise<boolean> {
    const config = args.constraints[0] as MealPlanOverlapValidationArgs;
    const object = args.object;

    const userId = object[config.userIdProperty];
    const startDate = object[config.startDateProperty];
    const endDate = object[config.endDateProperty];

    // Skip validation if required data is missing
    if (!userId || !startDate || !endDate) {
      return true;
    }

    // Skip validation if values are not valid types
    if (typeof userId !== 'string') {
      return true;
    }
    if (
      typeof startDate !== 'string' &&
      typeof startDate !== 'number' &&
      !(startDate instanceof Date)
    ) {
      return true;
    }
    if (typeof endDate !== 'string' && typeof endDate !== 'number' && !(endDate instanceof Date)) {
      return true;
    }

    // If overlaps are allowed, skip validation
    if (config.allowOverlaps) {
      return true;
    }

    try {
      // Parse dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return true; // Let other validators handle invalid dates
      }

      // Build where clause to find overlapping meal plans
      const whereClause: MealPlanWhereClause = {
        userId: userId,
        AND: [
          {
            startDate: {
              lte: end, // existing start <= new end
            },
          },
          {
            endDate: {
              gte: start, // existing end >= new start
            },
          },
        ],
      };

      // Exclude current meal plan if updating
      if (config.excludeCurrentProperty) {
        const currentMealPlanId = object[config.excludeCurrentProperty];
        if (currentMealPlanId) {
          whereClause.NOT = {
            mealPlanId: BigInt(currentMealPlanId as string),
          };
        }
      }

      const overlappingPlans = await this.prisma.mealPlan.findFirst({
        where: whereClause,
        select: { mealPlanId: true },
      });

      return overlappingPlans === null;
    } catch {
      // Don't fail validation due to database issues
      // Error is handled gracefully - validation passes to not block user
      return true; // Let validation pass on database errors, don't block user
    }
  }

  defaultMessage(args: TypedValidationArguments): string {
    const config = args.constraints[0] as MealPlanOverlapValidationArgs;

    if (config?.message) {
      return config.message;
    }

    return 'You already have an active meal plan that overlaps with this date range';
  }
}

/**
 * Validates that a meal plan doesn't overlap with existing active meal plans for the same user
 * @param config Configuration for overlap validation
 * @param validationOptions Standard class-validator options
 */
export function NoOverlappingMealPlans(
  config: MealPlanOverlapValidationArgs,
  validationOptions?: ValidationOptions,
) {
  return function (object: DecoratorTarget, propertyName: string) {
    registerDecorator({
      name: 'noOverlappingMealPlans',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions ?? {},
      constraints: [config],
      validator: NoOverlappingMealPlansConstraint,
    });
  };
}

/**
 * Pre-configured validator for new meal plans (no overlaps allowed)
 */
export function NoMealPlanOverlap(
  userIdProperty: string = 'userId',
  validationOptions?: ValidationOptions,
) {
  return NoOverlappingMealPlans(
    {
      userIdProperty,
      startDateProperty: 'startDate',
      endDateProperty: 'endDate',
      allowOverlaps: false,
    },
    validationOptions,
  );
}

/**
 * Pre-configured validator for meal plan updates (excludes current meal plan)
 */
export function NoMealPlanOverlapOnUpdate(
  userIdProperty: string = 'userId',
  currentIdProperty: string = 'id',
  validationOptions?: ValidationOptions,
) {
  return NoOverlappingMealPlans(
    {
      userIdProperty,
      startDateProperty: 'startDate',
      endDateProperty: 'endDate',
      allowOverlaps: false,
      excludeCurrentProperty: currentIdProperty,
    },
    validationOptions,
  );
}

/**
 * Validator that allows overlaps (for flexible meal planning)
 */
export function AllowMealPlanOverlap(
  userIdProperty: string = 'userId',
  validationOptions?: ValidationOptions,
) {
  return NoOverlappingMealPlans(
    {
      userIdProperty,
      startDateProperty: 'startDate',
      endDateProperty: 'endDate',
      allowOverlaps: true,
    },
    validationOptions,
  );
}
