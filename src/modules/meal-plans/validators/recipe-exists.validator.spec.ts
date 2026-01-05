import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { RecipeExistsConstraint } from './recipe-exists.validator';

const mockPrismaService = {
  recipe: {
    findFirst: mock(() => {}),
  },
};

describe('RecipeExistsConstraint', () => {
  let constraint: RecipeExistsConstraint;

  beforeEach(() => {
    mockPrismaService.recipe.findFirst.mockReset();
    constraint = new RecipeExistsConstraint(mockPrismaService as any);
  });

  describe('basic recipe existence validation', () => {
    it('should pass when recipe exists', async () => {
      mockPrismaService.recipe.findFirst.mockResolvedValueOnce({
        recipeId: BigInt(123),
      });

      const isValid = await constraint.validate('123', {
        constraints: [{}],
        object: {},
      } as any);

      expect(isValid).toBe(true);
      expect(mockPrismaService.recipe.findFirst).toHaveBeenCalledWith({
        where: {
          recipeId: BigInt(123),
        },
        select: { recipeId: true },
      });
    });

    it('should fail when recipe does not exist', async () => {
      mockPrismaService.recipe.findFirst.mockResolvedValueOnce(null);

      const isValid = await constraint.validate('123', {
        constraints: [{}],
        object: {},
      } as any);

      expect(isValid).toBe(false);
    });

    it('should fail when recipeId is not a valid number', async () => {
      const isValid = await constraint.validate('not-a-number', {
        constraints: [{}],
        object: {},
      } as any);

      expect(isValid).toBe(false);
      expect(mockPrismaService.recipe.findFirst).not.toHaveBeenCalled();
    });

    it('should pass when recipeId is empty (let other validators handle required)', async () => {
      const isValid = await constraint.validate('', {
        constraints: [{}],
        object: {},
      } as any);

      expect(isValid).toBe(true);
      expect(mockPrismaService.recipe.findFirst).not.toHaveBeenCalled();
    });

    it('should pass when recipeId is null', async () => {
      const isValid = await constraint.validate(null, {
        constraints: [{}],
        object: {},
      } as any);

      expect(isValid).toBe(true);
      expect(mockPrismaService.recipe.findFirst).not.toHaveBeenCalled();
    });

    it('should fail when recipeId is not a string', async () => {
      const isValid = await constraint.validate(123, {
        constraints: [{}],
        object: {},
      } as any);

      expect(isValid).toBe(false);
      expect(mockPrismaService.recipe.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('ownership validation', () => {
    it('should check ownership when configured', async () => {
      mockPrismaService.recipe.findFirst.mockResolvedValueOnce({
        recipeId: BigInt(123),
      });

      const isValid = await constraint.validate('123', {
        constraints: [
          {
            checkOwnership: true,
            userIdProperty: 'userId',
          },
        ],
        object: { userId: 'user-123' },
      } as any);

      expect(isValid).toBe(true);
      expect(mockPrismaService.recipe.findFirst).toHaveBeenCalledWith({
        where: {
          recipeId: BigInt(123),
          userId: 'user-123',
        },
        select: { recipeId: true },
      });
    });

    it('should not add user filter when userId is missing', async () => {
      mockPrismaService.recipe.findFirst.mockResolvedValueOnce({
        recipeId: BigInt(123),
      });

      const isValid = await constraint.validate('123', {
        constraints: [
          {
            checkOwnership: true,
            userIdProperty: 'userId',
          },
        ],
        object: {},
      } as any);

      expect(isValid).toBe(true);
      expect(mockPrismaService.recipe.findFirst).toHaveBeenCalledWith({
        where: {
          recipeId: BigInt(123),
        },
        select: { recipeId: true },
      });
    });

    it('should fail when recipe exists but user does not own it', async () => {
      mockPrismaService.recipe.findFirst.mockResolvedValueOnce(null);

      const isValid = await constraint.validate('123', {
        constraints: [
          {
            checkOwnership: true,
            userIdProperty: 'userId',
          },
        ],
        object: { userId: 'user-123' },
      } as any);

      expect(isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.recipe.findFirst.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const isValid = await constraint.validate('123', {
        constraints: [{}],
        object: {},
      } as any);

      expect(isValid).toBe(false);
      // Error is handled gracefully without logging
    });

    it('should handle BigInt conversion errors', async () => {
      // Very large number that might cause BigInt issues
      mockPrismaService.recipe.findFirst.mockResolvedValueOnce(null);

      const isValid = await constraint.validate('99999999999999999999999999999', {
        constraints: [{}],
        object: {},
      } as any);

      expect(isValid).toBe(false);
      expect(mockPrismaService.recipe.findFirst).toHaveBeenCalled();
    });
  });

  describe('default message generation', () => {
    it('should use custom message when provided', () => {
      const message = constraint.defaultMessage({
        constraints: [{ message: 'Custom error message' }],
      } as any);

      expect(message).toBe('Custom error message');
    });

    it('should use ownership message when checking ownership', () => {
      const message = constraint.defaultMessage({
        constraints: [{ checkOwnership: true }],
      } as any);

      expect(message).toBe('Recipe does not exist or you do not have access to it');
    });

    it('should use default message for simple existence check', () => {
      const message = constraint.defaultMessage({
        constraints: [{}],
      } as any);

      expect(message).toBe('Recipe does not exist');
    });
  });
});

describe('RecipeExists decorator variations', () => {
  beforeEach(() => {
    mockPrismaService.recipe.findFirst.mockReset();
  });

  describe('RecipeExistsSimple', () => {
    it('should pass validation when recipe exists', async () => {
      mockPrismaService.recipe.findFirst.mockResolvedValueOnce({
        recipeId: BigInt(123),
      });

      // Note: We can't fully test async validators with class-validator in unit tests
      // without setting up the full DI container, but we can test the constraint directly
      const constraint = new RecipeExistsConstraint(mockPrismaService as any);
      const isValid = await constraint.validate('123', {
        constraints: [{ checkOwnership: false, message: 'Recipe does not exist' }],
        object: { recipeId: '123' },
      } as any);

      expect(isValid).toBe(true);
    });

    it('should use correct error message', async () => {
      const constraint = new RecipeExistsConstraint(mockPrismaService as any);
      const message = constraint.defaultMessage({
        constraints: [{ checkOwnership: false, message: 'Recipe does not exist' }],
      } as any);

      expect(message).toBe('Recipe does not exist');
    });
  });

  describe('RecipeExistsForUser', () => {
    it('should check ownership with correct user property', async () => {
      mockPrismaService.recipe.findFirst.mockResolvedValueOnce({
        recipeId: BigInt(123),
      });

      const dto = { recipeId: '123', userId: 'user-456' };
      const constraint = new RecipeExistsConstraint(mockPrismaService as any);

      const isValid = await constraint.validate('123', {
        constraints: [
          {
            checkOwnership: true,
            userIdProperty: 'userId',
            message: 'Recipe does not exist or you do not have access to it',
          },
        ],
        object: dto,
      } as any);

      expect(isValid).toBe(true);
      expect(mockPrismaService.recipe.findFirst).toHaveBeenCalledWith({
        where: {
          recipeId: BigInt(123),
          userId: 'user-456',
        },
        select: { recipeId: true },
      });
    });
  });
});

describe('edge cases', () => {
  let constraint: RecipeExistsConstraint;

  beforeEach(() => {
    mockPrismaService.recipe.findFirst.mockReset();
    constraint = new RecipeExistsConstraint(mockPrismaService as any);
  });

  it('should handle very large recipe IDs', async () => {
    const largeId = '9223372036854775807'; // Max safe integer
    mockPrismaService.recipe.findFirst.mockResolvedValueOnce({
      recipeId: BigInt(largeId),
    });

    const isValid = await constraint.validate(largeId, {
      constraints: [{}],
      object: {},
    } as any);

    expect(isValid).toBe(true);
    expect(mockPrismaService.recipe.findFirst).toHaveBeenCalledWith({
      where: {
        recipeId: BigInt(largeId),
      },
      select: { recipeId: true },
    });
  });

  it('should handle zero as a recipe ID', async () => {
    const isValid = await constraint.validate('0', {
      constraints: [{}],
      object: {},
    } as any);

    expect(isValid).toBe(false);
    expect(mockPrismaService.recipe.findFirst).not.toHaveBeenCalled();
  });

  it('should handle negative recipe IDs', async () => {
    const isValid = await constraint.validate('-1', {
      constraints: [{}],
      object: {},
    } as any);

    expect(isValid).toBe(false);
    expect(mockPrismaService.recipe.findFirst).not.toHaveBeenCalled();
  });

  it('should handle whitespace in recipe ID', async () => {
    mockPrismaService.recipe.findFirst.mockResolvedValueOnce({
      recipeId: BigInt(123),
    });

    const isValid = await constraint.validate(' 123 ', {
      constraints: [{}],
      object: {},
    } as any);

    // Should pass because we trim whitespace and '123' is valid
    expect(isValid).toBe(true);
    expect(mockPrismaService.recipe.findFirst).toHaveBeenCalledWith({
      where: {
        recipeId: BigInt(123),
      },
      select: { recipeId: true },
    });
  });
});
