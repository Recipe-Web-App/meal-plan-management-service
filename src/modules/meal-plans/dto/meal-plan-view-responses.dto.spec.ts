import { describe, it, expect } from 'bun:test';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  DayMealsDto,
  DayViewResponseDto,
  WeekDayDto,
  WeekViewResponseDto,
  MonthDayMealCountsDto,
  MonthDayDto,
  MonthWeekDto,
  MonthViewResponseDto,
} from './meal-plan-view-responses.dto';
import { MealPlanRecipeResponseDto } from './meal-plan-response.dto';
import { MealType } from '../enums/meal-type.enum';

describe('DayMealsDto', () => {
  const mockRecipe: MealPlanRecipeResponseDto = {
    mealPlanRecipeId: '1',
    mealPlanId: '123',
    recipeId: '456',
    mealDate: new Date('2024-03-15'),
    mealType: MealType.BREAKFAST,
    servings: 4,
    notes: 'Test notes',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should validate successfully with meal arrays', async () => {
    const dto = plainToInstance(DayMealsDto, {
      breakfast: [mockRecipe],
      lunch: [mockRecipe],
      dinner: [mockRecipe],
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should allow empty arrays', async () => {
    const dto = plainToInstance(DayMealsDto, {
      breakfast: [],
      lunch: [],
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should allow undefined properties', async () => {
    const dto = plainToInstance(DayMealsDto, {
      breakfast: [mockRecipe],
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.lunch).toBeUndefined();
  });
});

describe('DayViewResponseDto', () => {
  const validDayView = {
    mealPlanId: '123',
    mealPlanName: 'Test Meal Plan',
    date: '2024-03-15',
    meals: {
      breakfast: [],
      lunch: [],
      dinner: [],
    },
    totalMeals: 0,
  };

  it('should validate successfully with valid data', async () => {
    const dto = plainToInstance(DayViewResponseDto, validDayView);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should transform date string to Date object', () => {
    const dto = plainToInstance(DayViewResponseDto, validDayView);
    expect(dto.date).toBeInstanceOf(Date);
  });

  it('should require all mandatory fields', async () => {
    const dto = plainToInstance(DayViewResponseDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('WeekDayDto', () => {
  const validWeekDay = {
    date: '2024-03-15',
    dayOfWeek: 'Friday',
    meals: {
      breakfast: [],
      lunch: [],
      dinner: [],
    },
    totalMeals: 0,
  };

  it('should validate successfully with valid data', async () => {
    const dto = plainToInstance(WeekDayDto, validWeekDay);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept all valid days of week', async () => {
    const validDays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    for (const day of validDays) {
      const dto = plainToInstance(WeekDayDto, {
        ...validWeekDay,
        dayOfWeek: day,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should reject invalid day of week', async () => {
    const dto = plainToInstance(WeekDayDto, {
      ...validWeekDay,
      dayOfWeek: 'InvalidDay',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});

describe('WeekViewResponseDto', () => {
  const validWeekView = {
    mealPlanId: '123',
    mealPlanName: 'Test Meal Plan',
    startDate: '2024-03-11',
    endDate: '2024-03-17',
    weekNumber: 11,
    days: [],
    totalMeals: 0,
  };

  it('should validate successfully with valid data', async () => {
    const dto = plainToInstance(WeekViewResponseDto, validWeekView);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should transform date strings to Date objects', () => {
    const dto = plainToInstance(WeekViewResponseDto, validWeekView);
    expect(dto.startDate).toBeInstanceOf(Date);
    expect(dto.endDate).toBeInstanceOf(Date);
  });
});

describe('MonthDayMealCountsDto', () => {
  it('should validate successfully with meal counts', async () => {
    const dto = plainToInstance(MonthDayMealCountsDto, {
      breakfast: 1,
      lunch: 1,
      dinner: 1,
      snack: 2,
      dessert: 1,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should allow undefined properties', async () => {
    const dto = plainToInstance(MonthDayMealCountsDto, {
      breakfast: 1,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.lunch).toBeUndefined();
  });
});

describe('MonthDayDto', () => {
  const validMonthDay = {
    date: '2024-03-15',
    dayOfMonth: 15,
    isCurrentMonth: true,
    mealCount: 3,
    meals: {
      breakfast: 1,
      lunch: 1,
      dinner: 1,
    },
  };

  it('should validate successfully with valid data', async () => {
    const dto = plainToInstance(MonthDayDto, validMonthDay);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should transform date string to Date object', () => {
    const dto = plainToInstance(MonthDayDto, validMonthDay);
    expect(dto.date).toBeInstanceOf(Date);
  });
});

describe('MonthWeekDto', () => {
  const validMonthWeek = {
    weekNumber: 11,
    startDate: '2024-03-11',
    endDate: '2024-03-17',
    days: [],
  };

  it('should validate successfully with valid data', async () => {
    const dto = plainToInstance(MonthWeekDto, validMonthWeek);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should transform date strings to Date objects', () => {
    const dto = plainToInstance(MonthWeekDto, validMonthWeek);
    expect(dto.startDate).toBeInstanceOf(Date);
    expect(dto.endDate).toBeInstanceOf(Date);
  });
});

describe('MonthViewResponseDto', () => {
  const validMonthView = {
    mealPlanId: '123',
    mealPlanName: 'Test Meal Plan',
    year: 2024,
    month: 3,
    monthName: 'March',
    weeks: [],
    totalMeals: 0,
  };

  it('should validate successfully with valid data', async () => {
    const dto = plainToInstance(MonthViewResponseDto, validMonthView);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should require all mandatory fields', async () => {
    const dto = plainToInstance(MonthViewResponseDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should handle nested week and day structures', async () => {
    const complexMonthView = {
      ...validMonthView,
      weeks: [
        {
          weekNumber: 11,
          startDate: '2024-03-11',
          endDate: '2024-03-17',
          days: [
            {
              date: '2024-03-15',
              dayOfMonth: 15,
              isCurrentMonth: true,
              mealCount: 3,
              meals: {
                breakfast: 1,
                lunch: 1,
                dinner: 1,
              },
            },
          ],
        },
      ],
    };

    const dto = plainToInstance(MonthViewResponseDto, complexMonthView);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
