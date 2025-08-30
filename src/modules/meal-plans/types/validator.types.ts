/**
 * TypeScript type definitions for custom validators
 */
import { ValidationArguments } from 'class-validator';

/**
 * Object that can be validated - has accessible properties
 */
export interface ValidatedObject {
  [key: string]: unknown;
}

/**
 * Object that allows property access for validation
 */
export interface PropertyAccessibleObject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [propertyKey: string]: any;
}

/**
 * Base configuration for validation constraints
 */
export interface ValidationConstraintConfig {
  message?: string;
  [key: string]: unknown;
}

/**
 * Date range validation configuration
 */
export interface DateRangeValidationArgs extends ValidationConstraintConfig {
  startDateProperty: string;
  endDateProperty: string;
  maxDurationDays?: number;
  minDurationDays?: number;
  allowPastDates?: boolean;
}

/**
 * Recipe exists validation configuration
 */
export interface RecipeExistsValidationArgs extends ValidationConstraintConfig {
  checkOwnership?: boolean;
  userIdProperty?: string;
  message?: string;
}

/**
 * Meal plan overlap validation configuration
 */
export interface MealPlanOverlapValidationArgs extends ValidationConstraintConfig {
  userIdProperty: string;
  startDateProperty: string;
  endDateProperty: string;
  allowOverlaps?: boolean;
  excludeCurrentProperty?: string;
  message?: string;
}

/**
 * Enhanced ValidationArguments with typed object
 */
export interface TypedValidationArguments extends ValidationArguments {
  object: ValidatedObject;
  constraints: ValidationConstraintConfig[];
}

/**
 * Prisma where clause for meal plan queries
 */
export interface MealPlanWhereClause {
  userId?: string;
  isActive?: boolean;
  deletedAt?: Date | null;
  startDate?: {
    lte?: Date;
  };
  endDate?: {
    gte?: Date;
  };
  AND?: Array<{
    startDate?: { lte?: Date };
    endDate?: { gte?: Date };
  }>;
  NOT?: {
    id?: string;
  };
}

/**
 * Prisma recipe where clause for recipe existence queries
 */
export interface RecipeWhereClause {
  recipeId: bigint;
  userId?: string;
  deletedAt?: Date | null;
}

/**
 * Type-safe decorator target for validators
 */
export interface DecoratorTarget {
  constructor: new (...args: unknown[]) => unknown;
}
