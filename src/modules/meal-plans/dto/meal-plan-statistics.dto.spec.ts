import { describe, it, expect } from 'bun:test';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MealPlanStatisticsDto, MealTypeBreakdownDto } from './meal-plan-statistics.dto';

describe('MealPlanStatisticsDto', () => {
  const validMealTypeBreakdown: MealTypeBreakdownDto = {
    breakfast: 7,
    lunch: 7,
    dinner: 7,
    snack: 5,
    dessert: 3,
  };

  const validStatistics = {
    totalRecipes: 29,
    totalMealTypes: 5,
    averageRecipesPerDay: 4.14,
    mealTypeBreakdown: validMealTypeBreakdown,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-03-07'),
    duration: 7,
  };

  it('should validate successfully with valid data', async () => {
    const dto = plainToInstance(MealPlanStatisticsDto, validStatistics);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should transform and validate all properties correctly', () => {
    const dto = plainToInstance(MealPlanStatisticsDto, {
      ...validStatistics,
      startDate: '2024-03-01',
      endDate: '2024-03-07',
    });

    expect(dto.totalRecipes).toBe(29);
    expect(dto.totalMealTypes).toBe(5);
    expect(dto.averageRecipesPerDay).toBeCloseTo(4.14);
    expect(dto.startDate).toBeInstanceOf(Date);
    expect(dto.endDate).toBeInstanceOf(Date);
    expect(dto.duration).toBe(7);
    expect(dto.mealTypeBreakdown).toEqual(validMealTypeBreakdown);
  });

  it('should reject negative values', async () => {
    const dto = plainToInstance(MealPlanStatisticsDto, {
      ...validStatistics,
      totalRecipes: -1,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints).toHaveProperty('min');
  });

  it('should reject invalid duration', async () => {
    const dto = plainToInstance(MealPlanStatisticsDto, {
      ...validStatistics,
      duration: 0,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints).toHaveProperty('min');
  });
});

describe('MealTypeBreakdownDto', () => {
  it('should validate successfully with valid data', async () => {
    const dto = plainToInstance(MealTypeBreakdownDto, {
      breakfast: 7,
      lunch: 7,
      dinner: 7,
      snack: 5,
      dessert: 3,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should allow optional properties', async () => {
    const dto = plainToInstance(MealTypeBreakdownDto, {
      breakfast: 7,
      lunch: 7,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.breakfast).toBe(7);
    expect(dto.lunch).toBe(7);
    expect(dto.dinner).toBeUndefined();
  });

  it('should reject negative values', async () => {
    const dto = plainToInstance(MealTypeBreakdownDto, {
      breakfast: -1,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints).toHaveProperty('min');
  });

  it('should accept zero values', async () => {
    const dto = plainToInstance(MealTypeBreakdownDto, {
      breakfast: 0,
      lunch: 0,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
