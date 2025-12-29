import { describe, it, expect, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '@/config/database.config';
import { PrismaClient } from '@generated/prisma/client';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let prisma: {
    $transaction: Mock<(fn: unknown, options?: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    prisma = {
      $transaction: mock(async (fn: unknown, _options?: unknown) => {
        return (fn as (client: unknown) => Promise<unknown>)(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    transactionService = module.get<TransactionService>(TransactionService);
    prisma = module.get(PrismaService) as typeof prisma;
  });

  afterEach(() => {
    prisma.$transaction.mockClear();
  });

  describe('executeTransaction', () => {
    it('should execute a function within a transaction', async () => {
      const mockResult = { id: 1, name: 'test' };
      const mockFn = mock(() => Promise.resolve(mockResult));

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      const result = await transactionService.executeTransaction(mockFn);

      expect(result).toEqual(mockResult);
      expect(prisma.$transaction).toHaveBeenCalledWith(mockFn, {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: undefined,
      });
      expect(mockFn).toHaveBeenCalledWith(prisma);
    });

    it('should use custom transaction options', async () => {
      const mockResult = { id: 1, name: 'test' };
      const mockFn = mock(() => Promise.resolve(mockResult));
      const options = {
        maxWait: 3000,
        timeout: 8000,
        isolationLevel: 'ReadCommitted' as const,
      };

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      await transactionService.executeTransaction(mockFn, options);

      expect(prisma.$transaction).toHaveBeenCalledWith(mockFn, options);
    });
  });

  describe('safeTransaction', () => {
    it('should return success result on successful transaction', async () => {
      const mockResult = { id: 1, name: 'test' };
      const mockFn = mock(() => Promise.resolve(mockResult));

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      const result = await transactionService.safeTransaction(mockFn);

      expect(result).toEqual({
        success: true,
        data: mockResult,
      });
    });

    it('should return error result on failed transaction', async () => {
      const mockError = new Error('Transaction failed');
      const mockFn = mock(() => Promise.reject(mockError));

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      const result = await transactionService.safeTransaction(mockFn);

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });

    it('should handle non-Error rejection', async () => {
      const mockFn = mock(() => Promise.reject('String error'));

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      const result = await transactionService.safeTransaction(mockFn);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('String error');
    });
  });

  describe('executeBatch', () => {
    it('should execute multiple operations in sequence', async () => {
      const operation1 = mock(() => Promise.resolve('result1'));
      const operation2 = mock(() => Promise.resolve('result2'));
      const operation3 = mock(() => Promise.resolve('result3'));

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      const result = await transactionService.executeBatch([operation1, operation2, operation3]);

      expect(result).toEqual(['result1', 'result2', 'result3']);
      expect(operation1).toHaveBeenCalledWith(prisma);
      expect(operation2).toHaveBeenCalledWith(prisma);
      expect(operation3).toHaveBeenCalledWith(prisma);
    });
  });

  describe('executeParallel', () => {
    it('should execute operations in parallel', async () => {
      const operation1 = mock(() => Promise.resolve('result1'));
      const operation2 = mock(() => Promise.resolve('result2'));
      const operation3 = mock(() => Promise.resolve('result3'));

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      const result = await transactionService.executeParallel([operation1, operation2, operation3]);

      expect(result).toEqual(['result1', 'result2', 'result3']);
      expect(operation1).toHaveBeenCalledWith(prisma);
      expect(operation2).toHaveBeenCalledWith(prisma);
      expect(operation3).toHaveBeenCalledWith(prisma);
    });
  });

  describe('retryTransaction', () => {
    it('should succeed on first attempt', async () => {
      const mockResult = { id: 1, name: 'test' };
      const mockFn = mock(() => Promise.resolve(mockResult));

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      const result = await transactionService.retryTransaction(mockFn, 3);

      expect(result).toEqual(mockResult);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error and eventually succeed', async () => {
      const mockResult = { id: 1, name: 'test' };
      const retryableError = Object.assign(new Error('Deadlock detected'), { code: 'P2034' });
      const mockFn = mock(() => Promise.reject(retryableError));
      mockFn.mockRejectedValueOnce(retryableError);
      mockFn.mockRejectedValueOnce(retryableError);
      mockFn.mockResolvedValue(mockResult);

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      // Mock sleep to avoid actual delays in tests
      const sleepSpy = spyOn(transactionService as any, 'sleep').mockResolvedValue(undefined);

      const result = await transactionService.retryTransaction(mockFn, 3, 100);

      expect(result).toEqual(mockResult);
      expect(mockFn).toHaveBeenCalledTimes(3);

      sleepSpy.mockRestore();
    });

    it('should not retry on non-retryable error', async () => {
      const nonRetryableError = new Error('Validation error');
      const mockFn = mock(() => Promise.reject(nonRetryableError));

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      await expect(transactionService.retryTransaction(mockFn, 3)).rejects.toThrow(
        'Validation error',
      );

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      const retryableError = new Error('Connection timeout');
      const mockFn = mock(() => Promise.reject(retryableError));

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(prisma);
      });

      // Mock sleep to avoid actual delays in tests
      const sleepSpy = spyOn(transactionService as any, 'sleep').mockResolvedValue(undefined);

      await expect(transactionService.retryTransaction(mockFn, 2, 100)).rejects.toThrow(
        'Connection timeout',
      );

      expect(mockFn).toHaveBeenCalledTimes(3); // initial attempt + 2 retries

      sleepSpy.mockRestore();
    });

    it('should recognize retryable error patterns', async () => {
      const service = transactionService as any;

      // Test Prisma error codes
      const prismaError = Object.assign(new Error('Deadlock'), { code: 'P2034' });
      expect(service.isRetryableError(prismaError)).toBe(true);

      // Test error message patterns
      const deadlockError = new Error('Transaction failed due to deadlock');
      expect(service.isRetryableError(deadlockError)).toBe(true);

      const connectionError = new Error('Connection lost');
      expect(service.isRetryableError(connectionError)).toBe(true);

      const timeoutError = new Error('Query timeout');
      expect(service.isRetryableError(timeoutError)).toBe(true);

      // Test non-retryable error
      const validationError = new Error('Invalid input');
      expect(service.isRetryableError(validationError)).toBe(false);
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const service = transactionService as any;
      const start = Date.now();

      await service.sleep(100);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow for small timing variations
    });
  });
});
