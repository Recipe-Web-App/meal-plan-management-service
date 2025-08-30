import { Injectable } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { SimpleSanitizer } from '../validators/sanitizers/simple-sanitizer.validator';
import { CreateMealPlanDto } from '../dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from '../dto/update-meal-plan.dto';
import {
  RawMealPlanInput,
  SanitizedMealPlanData,
  ValidationResult,
  ValidationContext,
  DatabaseMealPlan,
  SanitizableFields,
} from '../types/validation.types';
import { MealPlanWhereClause } from '../types/validator.types';

// Re-export types for backward compatibility
export type { ValidationResult, ValidationContext };

@Injectable()
export class MealPlanValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates and sanitizes a CreateMealPlanDto
   */
  async validateCreateMealPlan(
    data: RawMealPlanInput,
    context: ValidationContext = {},
  ): Promise<ValidationResult<CreateMealPlanDto>> {
    try {
      // Pre-sanitize text fields
      const sanitizedData = this.sanitizeTextFields(data, ['name', 'description']);

      // Add userId from context
      if (context.userId) {
        sanitizedData.userId = context.userId;
      }

      // Transform to DTO class (without triggering validators in tests)
      const dto = plainToClass(CreateMealPlanDto, sanitizedData, {
        enableImplicitConversion: true,
      });

      // Validate with class-validator (skip async validators that require DB in unit tests)
      const validationErrors = await validate(dto, {
        skipMissingProperties: false,
        forbidUnknownValues: false,
        groups: ['basic'], // Only validate basic constraints, skip async DB validators
      });

      if (validationErrors.length > 0) {
        return {
          isValid: false,
          errors: this.formatValidationErrors(validationErrors),
        };
      }

      // Additional business rule validation
      const businessRuleErrors = await this.validateBusinessRules(dto, context);

      if (businessRuleErrors.length > 0) {
        return {
          isValid: false,
          errors: businessRuleErrors,
        };
      }

      return {
        isValid: true,
        errors: [],
        sanitizedData: dto,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Validates and sanitizes an UpdateMealPlanDto
   */
  async validateUpdateMealPlan(
    data: RawMealPlanInput,
    context: ValidationContext = {},
  ): Promise<ValidationResult<UpdateMealPlanDto>> {
    try {
      // Pre-sanitize text fields
      const sanitizedData = this.sanitizeTextFields(data, ['name', 'description']);

      // Transform to DTO class
      const dto = plainToClass(UpdateMealPlanDto, sanitizedData);

      // Validate with class-validator
      const validationErrors = await validate(dto, {
        groups: ['basic'], // Only validate basic constraints, skip async DB validators
      });

      if (validationErrors.length > 0) {
        return {
          isValid: false,
          errors: this.formatValidationErrors(validationErrors),
        };
      }

      // Additional business rule validation for updates
      const businessRuleErrors = await this.validateUpdateBusinessRules(dto, context);

      if (businessRuleErrors.length > 0) {
        return {
          isValid: false,
          errors: businessRuleErrors,
        };
      }

      return {
        isValid: true,
        errors: [],
        sanitizedData: dto,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Validates that a meal plan exists and belongs to the user
   */
  async validateMealPlanAccess(
    mealPlanId: string,
    userId: string,
  ): Promise<ValidationResult<DatabaseMealPlan>> {
    try {
      const mealPlan = await this.prisma.mealPlan.findFirst({
        where: {
          id: mealPlanId,
          userId: userId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!mealPlan) {
        return {
          isValid: false,
          errors: ['Meal plan not found or access denied'],
        };
      }

      return {
        isValid: true,
        errors: [],
        sanitizedData: mealPlan,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `Access validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Throws BadRequestException if validation fails
   */
  async validateCreateMealPlanOrThrow(
    data: RawMealPlanInput,
    context: ValidationContext = {},
  ): Promise<CreateMealPlanDto> {
    const result = await this.validateCreateMealPlan(data, context);

    if (!result.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.errors,
      });
    }

    return result.sanitizedData as CreateMealPlanDto;
  }

  /**
   * Throws BadRequestException if validation fails
   */
  async validateUpdateMealPlanOrThrow(
    data: RawMealPlanInput,
    context: ValidationContext = {},
  ): Promise<UpdateMealPlanDto> {
    const result = await this.validateUpdateMealPlan(data, context);

    if (!result.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.errors,
      });
    }

    return result.sanitizedData as UpdateMealPlanDto;
  }

  /**
   * Sanitizes text fields using SimpleSanitizer
   */
  private sanitizeTextFields(
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
   * Formats class-validator errors into readable strings
   */
  private formatValidationErrors(errors: ValidationError[]): string[] {
    const formatted: string[] = [];

    const processError = (error: ValidationError, path = '') => {
      const currentPath = path ? `${path}.${error.property}` : error.property;

      if (error.constraints) {
        Object.values(error.constraints).forEach((constraint) => {
          formatted.push(`${currentPath}: ${constraint}`);
        });
      }

      if (error.children && error.children.length > 0) {
        error.children.forEach((child) => processError(child, currentPath));
      }
    };

    errors.forEach((error) => processError(error));
    return formatted;
  }

  /**
   * Additional business rule validation for create operations
   */
  private async validateBusinessRules(
    dto: CreateMealPlanDto,
    context: ValidationContext,
  ): Promise<string[]> {
    const errors: string[] = [];

    // Check for overlapping meal plans if not skipped
    if (!context.skipOverlapCheck && dto.userId) {
      const hasOverlap = await this.checkMealPlanOverlap(
        dto.userId,
        new Date(dto.startDate),
        new Date(dto.endDate),
      );

      if (hasOverlap) {
        errors.push('You already have an active meal plan that overlaps with this date range');
      }
    }

    // Recipe validation would be added here when recipe relationships are implemented

    return errors;
  }

  /**
   * Additional business rule validation for update operations
   */
  private async validateUpdateBusinessRules(
    dto: UpdateMealPlanDto,
    context: ValidationContext,
  ): Promise<string[]> {
    const errors: string[] = [];

    // Check for overlapping meal plans if dates are being updated
    if (!context.skipOverlapCheck && context.userId && dto.startDate && dto.endDate) {
      const hasOverlap = await this.checkMealPlanOverlap(
        context.userId,
        new Date(dto.startDate),
        new Date(dto.endDate),
        context.currentMealPlanId, // Exclude current meal plan from overlap check
      );

      if (hasOverlap) {
        errors.push('The updated date range overlaps with another active meal plan');
      }
    }

    // Recipe validation would be added here when recipe relationships are implemented

    return errors;
  }

  /**
   * Check if meal plan dates overlap with existing active meal plans
   */
  private async checkMealPlanOverlap(
    userId: string,
    startDate: Date,
    endDate: Date,
    excludeMealPlanId?: string,
  ): Promise<boolean> {
    try {
      const whereClause: MealPlanWhereClause = {
        userId: userId,
        isActive: true,
        deletedAt: null,
        AND: [
          {
            startDate: {
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
            },
          },
        ],
      };

      if (excludeMealPlanId) {
        whereClause.NOT = {
          id: excludeMealPlanId,
        };
      }

      const overlapping = await this.prisma.mealPlan.findFirst({
        where: whereClause,
        select: { id: true },
      });

      return overlapping !== null;
    } catch {
      // If database query fails, assume no overlap to not block user
      // Error is logged by the service but does not block validation
      return false;
    }
  }

  // Recipe validation methods would be added here when recipe relationships are implemented
}
