import { plainToClass, Transform } from 'class-transformer';
import { CreateMealPlanDto } from '../dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from '../dto/update-meal-plan.dto';
import { SimpleSanitizer } from '../validators/sanitizers/simple-sanitizer.validator';
import {
  RawMealPlanInput,
  SanitizedMealPlanData,
  DatabaseMealPlan,
  MealPlanQueryParams,
  PaginationParams,
  FilterParams,
  ApiResponse,
  SanitizableFields,
} from '../types/validation.types';

/**
 * Utility functions for transforming meal plan data
 */
export class MealPlanTransformationUtil {
  /**
   * Transforms raw input data to CreateMealPlanDto with proper sanitization
   */
  static toCreateMealPlanDto(rawData: RawMealPlanInput, userId?: string): CreateMealPlanDto {
    // Pre-sanitize text fields
    const sanitizedData = this.sanitizeTextFields(rawData, ['name', 'description']);

    // Add userId if provided (from authentication context)
    if (userId) {
      sanitizedData.userId = userId;
    }

    // Transform to DTO with class-transformer
    return plainToClass(CreateMealPlanDto, sanitizedData, {
      enableImplicitConversion: true,
    });
  }

  /**
   * Transforms raw input data to UpdateMealPlanDto with proper sanitization
   */
  static toUpdateMealPlanDto(
    rawData: RawMealPlanInput,
    userId?: string,
    currentMealPlanId?: string,
  ): UpdateMealPlanDto {
    // Pre-sanitize text fields
    const sanitizedData = this.sanitizeTextFields(rawData, ['name', 'description']);

    // Add internal fields for validation
    if (userId) {
      sanitizedData.userId = userId;
    }
    if (currentMealPlanId) {
      sanitizedData.id = currentMealPlanId;
    }

    // Transform to DTO with class-transformer
    return plainToClass(UpdateMealPlanDto, sanitizedData, {
      enableImplicitConversion: true,
    });
  }

  /**
   * Sanitizes text fields by stripping HTML and normalizing whitespace
   */
  private static sanitizeTextFields(
    data: RawMealPlanInput,
    fields: SanitizableFields[],
  ): SanitizedMealPlanData {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized: SanitizedMealPlanData = { ...data };

    fields.forEach((field) => {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        // Strip HTML and normalize whitespace
        sanitized[field] = SimpleSanitizer.normalizeWhitespace(
          SimpleSanitizer.stripHtml(sanitized[field]),
        );
      }
    });

    return sanitized;
  }

  /**
   * Transforms date strings or Date objects to ISO string format
   */
  static toISODate(dateInput: string | Date | null | undefined): string | null {
    if (!dateInput) {
      return null;
    }

    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

      if (isNaN(date.getTime())) {
        return null;
      }

      return date.toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Transforms database result to response format
   */
  static fromDatabaseModel(dbModel: DatabaseMealPlan | null): DatabaseMealPlan | null {
    if (!dbModel) {
      return null;
    }

    const transformed: DatabaseMealPlan = {
      id: dbModel.mealPlanId?.toString() ?? dbModel.id ?? '',
      userId: dbModel.userId,
      name: dbModel.name,
      description: dbModel.description,
      startDate: dbModel.startDate ? new Date(dbModel.startDate) : undefined,
      endDate: dbModel.endDate ? new Date(dbModel.endDate) : undefined,
      isActive: Boolean(dbModel.isActive),
      createdAt: dbModel.createdAt ? new Date(dbModel.createdAt) : undefined,
      updatedAt: dbModel.updatedAt ? new Date(dbModel.updatedAt) : undefined,
    };

    // Include additional fields if present
    if (dbModel.recipes) {
      transformed.recipes = dbModel.recipes;
    }

    return transformed;
  }

  /**
   * Transforms array of database models to response format
   */
  static fromDatabaseModels(dbModels: DatabaseMealPlan[]): DatabaseMealPlan[] {
    if (!Array.isArray(dbModels)) {
      return [];
    }

    return dbModels.map((model) => this.fromDatabaseModel(model));
  }

  /**
   * Validates and transforms pagination parameters
   */
  static transformPaginationParams(query: MealPlanQueryParams): PaginationParams {
    const page = Math.max(1, parseInt(String(query.page)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit)) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Validates and transforms filter parameters
   */
  static transformFilterParams(query: MealPlanQueryParams): FilterParams {
    const filters: FilterParams = {};

    // Transform isActive parameter
    if (query.isActive !== undefined) {
      if (typeof query.isActive === 'string') {
        filters.isActive = query.isActive.toLowerCase() === 'true';
      } else {
        filters.isActive = Boolean(query.isActive);
      }
    }

    // Transform date filters
    if (query.startDate) {
      const startDate = new Date(String(query.startDate));
      if (!isNaN(startDate.getTime())) {
        filters.startDate = startDate;
      }
    }

    if (query.endDate) {
      const endDate = new Date(String(query.endDate));
      if (!isNaN(endDate.getTime())) {
        filters.endDate = endDate;
      }
    }

    // Transform search parameter
    if (query.search && typeof query.search === 'string') {
      filters.search = SimpleSanitizer.normalizeWhitespace(
        SimpleSanitizer.stripHtml(query.search.trim()),
      );
    }

    return filters;
  }

  /**
   * Creates a standardized error response
   */
  static createErrorResponse(
    message: string,
    errors?: string[] | Record<string, string>,
    statusCode = 400,
  ): ApiResponse<never> {
    return {
      success: false,
      message,
      statusCode,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates a standardized success response
   */
  static createSuccessResponse<T>(
    data: T,
    message = 'Success',
    meta?: { page?: number; limit?: number; total?: number },
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Custom transformers for class-transformer decorators
 */
export class CustomTransformers {
  /**
   * Transforms string to trimmed and sanitized string
   */
  static sanitizeString() {
    return Transform(({ value }: { value: unknown }) => {
      if (typeof value === 'string') {
        return SimpleSanitizer.normalizeWhitespace(SimpleSanitizer.stripHtml(value));
      }
      return value;
    });
  }

  /**
   * Transforms various boolean representations to boolean
   */
  static toBoolean() {
    return Transform(({ value }: { value: unknown }) => {
      if (value === undefined || value === null) {
        return value;
      }

      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(lowerValue)) return true;
        if (['false', '0', 'no', 'off'].includes(lowerValue)) return false;
      }

      return Boolean(value);
    });
  }

  /**
   * Transforms string or number to positive integer
   */
  static toPositiveInteger(defaultValue = 1) {
    return Transform(({ value }: { value: unknown }) => {
      const num = parseInt(String(value));
      return isNaN(num) || num < 1 ? defaultValue : num;
    });
  }

  /**
   * Transforms date input to Date object with validation
   */
  static toValidDate() {
    return Transform(({ value }: { value: unknown }) => {
      if (!value) return value;

      let dateInput: string | number | Date;
      if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
        dateInput = value;
      } else {
        return value; // Return original value if can't be converted safely to avoid toString() issues
      }

      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? value : date;
    });
  }
}
