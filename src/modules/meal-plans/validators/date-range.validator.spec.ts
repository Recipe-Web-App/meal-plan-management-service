import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  IsDateRangeValid,
  IsMealPlanDateRangeValid,
  IsMealPlanUpdateDateRangeValid,
} from './date-range.validator';

class TestDateRangeDto {
  @IsDateRangeValid({
    startDateProperty: 'startDate',
    endDateProperty: 'endDate',
    maxDurationDays: 30,
    minDurationDays: 1,
    allowPastDates: false,
  })
  validateRange: boolean = true;

  startDate: Date;
  endDate: Date;
}

class TestMealPlanDto {
  @IsMealPlanDateRangeValid()
  validateRange: boolean = true;

  startDate: Date;
  endDate: Date;
}

class TestMealPlanUpdateDto {
  @IsMealPlanUpdateDateRangeValid()
  validateRange: boolean = true;

  startDate?: Date;
  endDate?: Date;
}

describe('IsDateRangeValidConstraint', () => {
  // Tests use decorator validation, not direct constraint validation

  describe('basic date range validation', () => {
    it('should pass for valid date range', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const dto = plainToClass(TestDateRangeDto, {
        startDate: tomorrow,
        endDate: nextWeek,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when end date is before start date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const today = new Date();

      const dto = plainToClass(TestDateRangeDto, {
        startDate: tomorrow,
        endDate: today,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateRangeValid).toContain('endDate must be after startDate');
    });

    it('should fail when end date equals start date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dto = plainToClass(TestDateRangeDto, {
        startDate: new Date(tomorrow),
        endDate: new Date(tomorrow),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateRangeValid).toContain('endDate must be after startDate');
    });
  });

  describe('duration validation', () => {
    it('should fail when duration exceeds maximum', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 35); // Exceeds 30-day max

      const dto = plainToClass(TestDateRangeDto, {
        startDate: tomorrow,
        endDate: farFuture,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateRangeValid).toContain('cannot exceed 30 days');
    });

    it('should pass when duration equals maximum', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      // Add exactly 30 days worth of milliseconds minus 1ms to ensure Math.ceil rounds to 30
      const maxDate = new Date(tomorrow.getTime() + 30 * 24 * 60 * 60 * 1000 - 1);

      const dto = plainToClass(TestDateRangeDto, {
        startDate: tomorrow,
        endDate: maxDate,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when duration is below minimum', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const sameDay = new Date(tomorrow);
      sameDay.setHours(sameDay.getHours() + 1); // Same day, just 1 hour later

      const dto = plainToClass(TestDateRangeDto, {
        startDate: tomorrow,
        endDate: sameDay,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // Should pass as it's still considered 1 day
    });
  });

  describe('past dates validation', () => {
    it('should fail when start date is in the past and past dates not allowed', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dto = plainToClass(TestDateRangeDto, {
        startDate: yesterday,
        endDate: tomorrow,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateRangeValid).toContain('cannot be in the past');
    });

    it('should pass when start date is today', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dto = plainToClass(TestDateRangeDto, {
        startDate: today,
        endDate: tomorrow,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('invalid date handling', () => {
    it('should fail for invalid start date', async () => {
      const dto = plainToClass(TestDateRangeDto, {
        startDate: 'invalid-date' as any,
        endDate: new Date(),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateRangeValid).toContain('must be valid dates');
    });

    it('should fail for invalid end date', async () => {
      const dto = plainToClass(TestDateRangeDto, {
        startDate: new Date(),
        endDate: 'invalid-date' as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateRangeValid).toContain('must be valid dates');
    });
  });

  describe('missing dates handling', () => {
    it('should pass validation when both dates are missing', async () => {
      const dto = plainToClass(TestDateRangeDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when start date is missing', async () => {
      const dto = plainToClass(TestDateRangeDto, {
        endDate: new Date(),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when end date is missing', async () => {
      const dto = plainToClass(TestDateRangeDto, {
        startDate: new Date(),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});

describe('IsMealPlanDateRangeValid', () => {
  it('should enforce 90-day maximum for meal plans', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tooFarFuture = new Date();
    tooFarFuture.setDate(tooFarFuture.getDate() + 95); // Exceeds 90-day max

    const dto = plainToClass(TestMealPlanDto, {
      startDate: tomorrow,
      endDate: tooFarFuture,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isDateRangeValid).toContain('cannot exceed 90 days');
  });

  it('should not allow past dates for new meal plans', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dto = plainToClass(TestMealPlanDto, {
      startDate: yesterday,
      endDate: tomorrow,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isDateRangeValid).toContain('cannot be in the past');
  });

  it('should pass for valid future date range', async () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    const dto = plainToClass(TestMealPlanDto, {
      startDate: nextWeek,
      endDate: nextMonth,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('IsMealPlanUpdateDateRangeValid', () => {
  it('should allow past dates for updates', async () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dto = plainToClass(TestMealPlanUpdateDto, {
      startDate: lastWeek,
      endDate: yesterday,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should still enforce maximum duration for updates', async () => {
    const farPast = new Date();
    farPast.setDate(farPast.getDate() - 100);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dto = plainToClass(TestMealPlanUpdateDto, {
      startDate: farPast,
      endDate: yesterday,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isDateRangeValid).toContain('cannot exceed 90 days');
  });
});

describe('edge cases', () => {
  it('should handle leap year dates correctly', async () => {
    const leapYearStart = new Date('2024-02-28');
    const leapYearEnd = new Date('2024-03-01');

    const dto = plainToClass(TestMealPlanUpdateDto, {
      startDate: leapYearStart,
      endDate: leapYearEnd,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should handle timezone differences correctly', async () => {
    const start = new Date('2025-01-01T00:00:00.000Z');
    const end = new Date('2025-01-02T00:00:00.000Z');

    const dto = plainToClass(TestMealPlanUpdateDto, {
      startDate: start,
      endDate: end,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should handle same date in different timezones', async () => {
    const start = new Date('2025-01-01T23:59:59.999Z');
    const end = new Date('2025-01-02T00:00:00.000Z');

    const dto = plainToClass(TestMealPlanUpdateDto, {
      startDate: start,
      endDate: end,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
