import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import {
  RecipeExistsValidationArgs,
  TypedValidationArguments,
  DecoratorTarget,
  RecipeWhereClause,
} from '../types/validator.types';

@ValidatorConstraint({ name: 'recipeExists', async: true })
@Injectable()
export class RecipeExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(recipeId: unknown, args: TypedValidationArguments): Promise<boolean> {
    if (!recipeId) {
      return true; // Let other validators handle required validation
    }

    if (typeof recipeId !== 'string') {
      return false;
    }

    try {
      const config = args.constraints[0] as RecipeExistsValidationArgs;
      const object = args.object;

      // Convert string ID to BigInt for database query
      // First validate that it's a valid number string
      const trimmedId = recipeId.trim();
      if (!/^-?\d+$/.test(trimmedId)) {
        return false;
      }

      let recipeIdBigInt: bigint;
      try {
        recipeIdBigInt = BigInt(trimmedId);
      } catch {
        return false;
      }

      // Recipe IDs should be positive
      if (recipeIdBigInt <= 0n) {
        return false;
      }

      const whereClause: RecipeWhereClause = {
        recipeId: recipeIdBigInt,
      };

      // If ownership check is required, add user filter
      if (config?.checkOwnership && config.userIdProperty) {
        const userId = object[config.userIdProperty];
        if (userId && typeof userId === 'string') {
          whereClause.userId = userId;
        }
      }

      const recipe = await this.prisma.recipe.findFirst({
        where: whereClause,
        select: { recipeId: true }, // Only select ID for performance
      });

      return recipe !== null;
    } catch {
      // Don't fail validation due to database issues
      // Error is handled gracefully
      return false;
    }
  }

  defaultMessage(args: TypedValidationArguments): string {
    const config = args.constraints[0] as RecipeExistsValidationArgs;

    if (config?.message) {
      return config.message;
    }

    if (config?.checkOwnership) {
      return 'Recipe does not exist or you do not have access to it';
    }

    return 'Recipe does not exist';
  }
}

/**
 * Validates that a recipe exists in the database
 * @param config Configuration for recipe existence validation
 * @param validationOptions Standard class-validator options
 */
export function RecipeExists(
  config?: RecipeExistsValidationArgs,
  validationOptions?: ValidationOptions,
) {
  return function (object: DecoratorTarget, propertyName: string) {
    registerDecorator({
      name: 'recipeExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions ?? {},
      constraints: [config ?? {}],
      validator: RecipeExistsConstraint,
    });
  };
}

/**
 * Validates that a recipe exists and the user has access to it
 */
export function RecipeExistsForUser(
  userIdProperty: string = 'userId',
  validationOptions?: ValidationOptions,
) {
  return RecipeExists(
    {
      checkOwnership: true,
      userIdProperty,
      message: 'Recipe does not exist or you do not have access to it',
    },
    validationOptions,
  );
}

/**
 * Simple recipe existence check without ownership validation
 */
export function RecipeExistsSimple(validationOptions?: ValidationOptions) {
  return RecipeExists(
    {
      checkOwnership: false,
      message: 'Recipe does not exist',
    },
    validationOptions,
  );
}
