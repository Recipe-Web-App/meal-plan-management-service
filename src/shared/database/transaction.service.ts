import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { Prisma } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute a function within a database transaction
   * @param fn - Function to execute within the transaction
   * @param options - Transaction options (timeout, isolation level)
   * @returns Promise with transaction result
   */
  async executeTransaction<T>(
    fn: (tx: TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.prisma.$transaction(fn, {
      maxWait: options?.maxWait ?? 5000, // 5 seconds
      timeout: options?.timeout ?? 10000, // 10 seconds
      isolationLevel: options?.isolationLevel,
    });
  }

  /**
   * Execute a function within a transaction with error handling
   * @param fn - Function to execute within the transaction
   * @param options - Transaction options
   * @returns Promise with wrapped result including success/error info
   */
  async safeTransaction<T>(
    fn: (tx: TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<TransactionResult<T>> {
    try {
      const data = await this.executeTransaction(fn, options);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Execute multiple operations in a single transaction
   * @param operations - Array of operations to execute
   * @param options - Transaction options
   * @returns Promise with array of results
   */
  async executeBatch<T>(
    operations: Array<(tx: TransactionClient) => Promise<T>>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T[]> {
    return this.executeTransaction(async (tx) => {
      const results: T[] = [];
      for (const operation of operations) {
        const result = await operation(tx);
        results.push(result);
      }
      return results;
    }, options);
  }

  /**
   * Execute operations in parallel within a transaction
   * WARNING: Use with caution - parallel operations in a transaction can cause deadlocks
   * @param operations - Array of operations to execute in parallel
   * @param options - Transaction options
   * @returns Promise with array of results
   */
  async executeParallel<T>(
    operations: Array<(tx: TransactionClient) => Promise<T>>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T[]> {
    return this.executeTransaction(async (tx) => {
      return Promise.all(operations.map((operation) => operation(tx)));
    }, options);
  }

  /**
   * Retry a transaction with exponential backoff
   * @param fn - Function to execute within the transaction
   * @param maxRetries - Maximum number of retries
   * @param baseDelay - Base delay in milliseconds
   * @param options - Transaction options
   * @returns Promise with transaction result
   */
  async retryTransaction<T>(
    fn: (tx: TransactionClient) => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeTransaction(fn, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retryable (e.g., deadlock, serialization failure)
        if (!this.isRetryableError(lastError)) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Check if an error is retryable
   * @param error - Error to check
   * @returns True if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableCodes = [
      'P2034', // Transaction failed due to a write conflict or a deadlock
      'P2002', // Unique constraint violation (might be retryable in some cases)
    ];

    // Check if it's a Prisma error with a retryable code
    if ('code' in error) {
      return retryableCodes.includes(error.code as string);
    }

    // Check for common retryable database errors
    const message = error.message.toLowerCase();
    return (
      message.includes('deadlock') ||
      message.includes('serialization failure') ||
      message.includes('connection') ||
      message.includes('timeout')
    );
  }

  /**
   * Sleep for a specified number of milliseconds
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after the delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
