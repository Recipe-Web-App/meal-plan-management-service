import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { TypedValidationArguments, DecoratorTarget } from '../../types/validator.types';

/**
 * Simple HTML sanitizer that removes all HTML tags
 */
export class SimpleSanitizer {
  static stripHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }
    return input.replace(/<[^>]*>/g, '').trim();
  }

  static normalizeWhitespace(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }
    return input
      .replace(/[ \t]+/g, ' ') // Collapse multiple spaces and tabs
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks to 2
      .trim();
  }
}

@ValidatorConstraint({ name: 'stripHtml', async: false })
export class StripHtmlConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, _args: TypedValidationArguments): boolean {
    // Always passes validation - this is just for transformation
    return true;
  }

  defaultMessage(): string {
    return 'HTML content has been sanitized';
  }
}

@ValidatorConstraint({ name: 'normalizeWhitespace', async: false })
export class NormalizeWhitespaceConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, _args: TypedValidationArguments): boolean {
    // Always passes validation - this is just for transformation
    return true;
  }

  defaultMessage(): string {
    return 'Whitespace has been normalized';
  }
}

/**
 * Validator that strips HTML tags from input
 */
export function StripHtml(validationOptions?: ValidationOptions) {
  return function (object: DecoratorTarget, propertyName: string) {
    registerDecorator({
      name: 'stripHtml',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: StripHtmlConstraint,
    });
  };
}

/**
 * Validator that normalizes whitespace in input
 */
export function NormalizeWhitespace(validationOptions?: ValidationOptions) {
  return function (object: DecoratorTarget, propertyName: string) {
    registerDecorator({
      name: 'normalizeWhitespace',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: NormalizeWhitespaceConstraint,
    });
  };
}

/**
 * Combined validator that strips HTML and normalizes whitespace
 */
export function SanitizeText(validationOptions?: ValidationOptions) {
  return function (object: DecoratorTarget, propertyName: string) {
    // Apply both validators
    StripHtml(validationOptions)(object, propertyName);
    NormalizeWhitespace(validationOptions)(object, propertyName);
  };
}
