import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import {
  DateRangeValidationArgs,
  TypedValidationArguments,
  DecoratorTarget,
} from '../types/validator.types';

@ValidatorConstraint({ name: 'isDateRangeValid', async: false })
export class IsDateRangeValidConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: TypedValidationArguments): boolean {
    const config = args.constraints[0] as DateRangeValidationArgs;
    const object = args.object;

    const startDate = object[config.startDateProperty];
    const endDate = object[config.endDateProperty];

    // Skip validation if either date is missing (let other validators handle required fields)
    if (!startDate || !endDate) {
      return true;
    }

    // Skip validation if values are not valid date inputs
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

    // Ensure both values are valid dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    // Check if end date is after start date
    if (end <= start) {
      return false;
    }

    // Check duration limits
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    if (config.maxDurationDays && durationDays > config.maxDurationDays) {
      return false;
    }

    if (config.minDurationDays && durationDays < config.minDurationDays) {
      return false;
    }

    // Check if past dates are allowed
    if (!config.allowPastDates) {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today

      if (start < now) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: TypedValidationArguments): string {
    const config = args.constraints[0] as DateRangeValidationArgs;
    const object = args.object;

    const startDate = object[config.startDateProperty];
    const endDate = object[config.endDateProperty];

    if (!startDate || !endDate) {
      return `Both ${config.startDateProperty} and ${config.endDateProperty} must be provided`;
    }

    // Skip validation if values are not valid date inputs
    if (
      typeof startDate !== 'string' &&
      typeof startDate !== 'number' &&
      !(startDate instanceof Date)
    ) {
      return 'Start date must be a valid date format';
    }
    if (typeof endDate !== 'string' && typeof endDate !== 'number' && !(endDate instanceof Date)) {
      return 'End date must be a valid date format';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Start date and end date must be valid dates';
    }

    if (end <= start) {
      return `${config.endDateProperty} must be after ${config.startDateProperty}`;
    }

    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    if (config.maxDurationDays && durationDays > config.maxDurationDays) {
      return `Meal plan duration cannot exceed ${config.maxDurationDays} days`;
    }

    if (config.minDurationDays && durationDays < config.minDurationDays) {
      return `Meal plan duration must be at least ${config.minDurationDays} day${config.minDurationDays > 1 ? 's' : ''}`;
    }

    if (!config.allowPastDates) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (start < now) {
        return 'Meal plan start date cannot be in the past';
      }
    }

    return 'Invalid date range';
  }
}

/**
 * Validates that a date range is valid based on the provided configuration
 * @param config Configuration for date range validation
 * @param validationOptions Standard class-validator options
 */
export function IsDateRangeValid(
  config: DateRangeValidationArgs,
  validationOptions?: ValidationOptions,
) {
  return function (object: DecoratorTarget, propertyName: string) {
    registerDecorator({
      name: 'isDateRangeValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions ?? {},
      constraints: [config],
      validator: IsDateRangeValidConstraint,
    });
  };
}

/**
 * Pre-configured validator for meal plans with standard business rules
 */
export function IsMealPlanDateRangeValid(validationOptions?: ValidationOptions) {
  return IsDateRangeValid(
    {
      startDateProperty: 'startDate',
      endDateProperty: 'endDate',
      maxDurationDays: 90, // 3 months max
      minDurationDays: 1, // At least 1 day
      allowPastDates: false, // No past dates for new meal plans
    },
    validationOptions,
  );
}

/**
 * Pre-configured validator for meal plan updates (allows past dates)
 */
export function IsMealPlanUpdateDateRangeValid(validationOptions?: ValidationOptions) {
  return IsDateRangeValid(
    {
      startDateProperty: 'startDate',
      endDateProperty: 'endDate',
      maxDurationDays: 90, // 3 months max
      minDurationDays: 1, // At least 1 day
      allowPastDates: true, // Allow past dates for updates
    },
    validationOptions,
  );
}
