import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PaginationDto, PaginatedResponseDto } from './pagination.dto';

describe('PaginationDto', () => {
  describe('valid data', () => {
    it('should pass validation with valid page and limit', async () => {
      const validData = { page: 1, limit: 10 };

      const dto = plainToClass(PaginationDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.offset).toBe(0);
    });

    it('should use default values when not provided', async () => {
      const dto = plainToClass(PaginationDto, {});
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.offset).toBe(0);
    });

    it('should transform string numbers to integers', async () => {
      const stringData = { page: '2', limit: '20' } as any;

      const dto = plainToClass(PaginationDto, stringData);

      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(20);
      expect(typeof dto.page).toBe('number');
      expect(typeof dto.limit).toBe('number');
    });

    it('should calculate correct offset for different pages', async () => {
      const testCases = [
        { page: 1, limit: 10, expectedOffset: 0 },
        { page: 2, limit: 10, expectedOffset: 10 },
        { page: 3, limit: 5, expectedOffset: 10 },
        { page: 5, limit: 20, expectedOffset: 80 },
        { page: 1, limit: 1, expectedOffset: 0 },
      ];

      for (const testCase of testCases) {
        const dto = plainToClass(PaginationDto, testCase);
        expect(dto.offset).toBe(testCase.expectedOffset);
      }
    });

    it('should accept boundary values', async () => {
      const boundaryTests = [
        { page: 1, limit: 1 }, // minimum values
        { page: 1000, limit: 100 }, // maximum values
        { page: 500, limit: 50 }, // middle values
      ];

      for (const testData of boundaryTests) {
        const dto = plainToClass(PaginationDto, testData);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.page).toBe(testData.page);
        expect(dto.limit).toBe(testData.limit);
      }
    });
  });

  describe('page validation', () => {
    it('should fail when page is not an integer', async () => {
      const invalidData = { page: 1.5 };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('page');
      expect(errors[0]?.constraints).toHaveProperty('isInt');
    });

    it('should fail when page is less than 1', async () => {
      const invalidData = { page: 0 };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('page');
      expect(errors[0]?.constraints).toHaveProperty('min');
    });

    it('should fail when page is greater than 1000', async () => {
      const invalidData = { page: 1001 };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('page');
      expect(errors[0]?.constraints).toHaveProperty('max');
    });

    it('should fail when page is not a number', async () => {
      const invalidData = { page: 'invalid' };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('page');
      expect(errors[0]?.constraints).toHaveProperty('isInt');
    });

    it('should fail when page is negative', async () => {
      const invalidData = { page: -1 };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('page');
      expect(errors[0]?.constraints).toHaveProperty('min');
    });
  });

  describe('limit validation', () => {
    it('should fail when limit is not an integer', async () => {
      const invalidData = { limit: 10.5 };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('limit');
      expect(errors[0]?.constraints).toHaveProperty('isInt');
    });

    it('should fail when limit is less than 1', async () => {
      const invalidData = { limit: 0 };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('limit');
      expect(errors[0]?.constraints).toHaveProperty('min');
    });

    it('should fail when limit is greater than 100', async () => {
      const invalidData = { limit: 101 };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('limit');
      expect(errors[0]?.constraints).toHaveProperty('max');
    });

    it('should fail when limit is not a number', async () => {
      const invalidData = { limit: 'invalid' };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('limit');
      expect(errors[0]?.constraints).toHaveProperty('isInt');
    });

    it('should fail when limit is negative', async () => {
      const invalidData = { limit: -5 };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('limit');
      expect(errors[0]?.constraints).toHaveProperty('min');
    });
  });

  describe('combined scenarios', () => {
    it('should handle multiple validation errors', async () => {
      const invalidData = {
        page: 0,
        limit: 101,
      };

      const dto = plainToClass(PaginationDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(2);

      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('page');
      expect(errorProperties).toContain('limit');
    });

    it('should work with only page provided', async () => {
      const dto = plainToClass(PaginationDto, { page: 5 });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(20); // default
      expect(dto.offset).toBe(80);
    });

    it('should work with only limit provided', async () => {
      const dto = plainToClass(PaginationDto, { limit: 25 });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1); // default
      expect(dto.limit).toBe(25);
      expect(dto.offset).toBe(0);
    });

    it('should handle various combinations', async () => {
      const combinations = [
        { page: 1, limit: 5, expectedOffset: 0 },
        { page: 10, limit: 25, expectedOffset: 225 },
        { page: 100, limit: 1, expectedOffset: 99 },
        { page: 2, limit: 50, expectedOffset: 50 },
      ];

      for (const combo of combinations) {
        const dto = plainToClass(PaginationDto, combo);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.page).toBe(combo.page);
        expect(dto.limit).toBe(combo.limit);
        expect(dto.offset).toBe(combo.expectedOffset);
      }
    });
  });
});

describe('PaginatedResponseDto', () => {
  const sampleData = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  describe('pagination metadata calculation', () => {
    it('should calculate correct pagination metadata for first page', () => {
      const response = new PaginatedResponseDto(sampleData, 25, 1, 10);

      expect(response.data).toEqual(sampleData);
      expect(response.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrevious: false,
      });
    });

    it('should calculate correct pagination metadata for middle page', () => {
      const response = new PaginatedResponseDto(sampleData, 25, 2, 10);

      expect(response.meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      });
    });

    it('should calculate correct pagination metadata for last page', () => {
      const response = new PaginatedResponseDto(sampleData, 25, 3, 10);

      expect(response.meta).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: false,
        hasPrevious: true,
      });
    });

    it('should handle single page results', () => {
      const response = new PaginatedResponseDto(sampleData, 3, 1, 10);

      expect(response.meta).toEqual({
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    });

    it('should handle empty results', () => {
      const response = new PaginatedResponseDto([], 0, 1, 10);

      expect(response.data).toEqual([]);
      expect(response.meta).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      });
    });

    it('should handle exact page boundaries', () => {
      const response = new PaginatedResponseDto(sampleData, 20, 2, 10);

      expect(response.meta).toEqual({
        page: 2,
        limit: 10,
        total: 20,
        totalPages: 2,
        hasNext: false,
        hasPrevious: true,
      });
    });
  });

  describe('different page sizes', () => {
    it('should handle small page size', () => {
      const response = new PaginatedResponseDto([sampleData[0]], 100, 1, 1);

      expect(response.meta).toEqual({
        page: 1,
        limit: 1,
        total: 100,
        totalPages: 100,
        hasNext: true,
        hasPrevious: false,
      });
    });

    it('should handle large page size', () => {
      const response = new PaginatedResponseDto(sampleData, 3, 1, 100);

      expect(response.meta).toEqual({
        page: 1,
        limit: 100,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    });

    it('should calculate total pages correctly for various scenarios', () => {
      const scenarios = [
        { total: 10, limit: 3, expectedTotalPages: 4 }, // 10/3 = 3.33, ceil = 4
        { total: 15, limit: 5, expectedTotalPages: 3 }, // 15/5 = 3
        { total: 1, limit: 10, expectedTotalPages: 1 }, // 1/10 = 0.1, ceil = 1
        { total: 0, limit: 10, expectedTotalPages: 0 }, // 0/10 = 0
      ];

      for (const scenario of scenarios) {
        const response = new PaginatedResponseDto([], scenario.total, 1, scenario.limit);
        expect(response.meta.totalPages).toBe(scenario.expectedTotalPages);
      }
    });
  });

  describe('navigation flags', () => {
    it('should set correct navigation flags for various page positions', () => {
      const testCases = [
        { page: 1, total: 100, limit: 10, expectedHasNext: true, expectedHasPrevious: false },
        { page: 5, total: 100, limit: 10, expectedHasNext: true, expectedHasPrevious: true },
        { page: 10, total: 100, limit: 10, expectedHasNext: false, expectedHasPrevious: true },
        { page: 1, total: 5, limit: 10, expectedHasNext: false, expectedHasPrevious: false },
      ];

      for (const testCase of testCases) {
        const response = new PaginatedResponseDto(
          sampleData,
          testCase.total,
          testCase.page,
          testCase.limit,
        );

        expect(response.meta.hasNext).toBe(testCase.expectedHasNext);
        expect(response.meta.hasPrevious).toBe(testCase.expectedHasPrevious);
      }
    });
  });

  describe('data handling', () => {
    it('should preserve original data', () => {
      const complexData = [
        { id: 1, name: 'Complex Item', nested: { value: 'test' }, array: [1, 2, 3] },
        { id: 2, name: 'Another Item', nested: { value: 'test2' }, array: [4, 5, 6] },
      ];

      const response = new PaginatedResponseDto(complexData, 10, 1, 10);

      expect(response.data).toEqual(complexData);
      expect(response.data).toBe(complexData); // data is assigned directly
    });

    it('should handle different data types', () => {
      const numberData = [1, 2, 3, 4, 5];
      const response = new PaginatedResponseDto(numberData, 20, 1, 5);

      expect(response.data).toEqual(numberData);
      expect(response.meta.total).toBe(20);
    });
  });
});
