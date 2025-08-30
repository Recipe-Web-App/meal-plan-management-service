/**
 * TypeScript type definitions for meal plan validation system
 */

/**
 * Raw input data from external sources (controllers, API requests)
 * May contain untrusted/unsanitized data
 */
export interface RawMealPlanInput {
  name?: unknown;
  description?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  isActive?: unknown;
  // Allow additional properties for flexible input
  [key: string]: unknown;
}

/**
 * Data after text sanitization but before DTO validation
 */
export interface SanitizedMealPlanData {
  name?: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  userId?: string;
  mealPlanId?: string; // For updates
  // Allow additional sanitized properties
  [key: string]: unknown;
}

/**
 * Generic validation result
 */
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: string[];
  sanitizedData?: T;
}

/**
 * Validation context for business rules
 */
export interface ValidationContext {
  userId?: string;
  currentMealPlanId?: string;
  skipOverlapCheck?: boolean;
}

/**
 * Database meal plan model (from Prisma)
 */
export interface DatabaseMealPlan {
  mealPlanId: bigint;
  userId: string;
  name: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  recipes?: unknown[];
  [key: string]: unknown;
}

/**
 * Query parameters for filtering meal plans
 */
export interface MealPlanQueryParams {
  page?: string | number;
  limit?: string | number;
  isActive?: string | boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  [key: string]: unknown;
}

/**
 * Processed pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Processed filter parameters
 */
export interface FilterParams {
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Standardized API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[] | Record<string, string>;
  statusCode?: number;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  timestamp: string;
}

/**
 * Text fields that require sanitization
 */
export type SanitizableFields = 'name' | 'description' | 'search';
