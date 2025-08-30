import { Injectable } from '@nestjs/common';
import { PrismaService, DatabaseHealthStatus } from '@/config/database.config';
import { LoggerService } from '@/shared/services/logger.service';

export interface ConnectionPoolStats {
  activeConnections: number;
  idleConnections: number;
  pendingConnections: number;
  totalConnections: number;
}

export interface DatabaseMetrics {
  connectionStatus: ReturnType<PrismaService['getConnectionStatus']>;
  healthStatus: DatabaseHealthStatus;
  uptime: number;
  lastHealthCheck: Date;
}

@Injectable()
export class ConnectionService {
  private startTime = Date.now();
  private lastHealthCheck = new Date();

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get comprehensive database metrics
   */
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const connectionStatus = this.prisma.getConnectionStatus();
    const healthStatus = await this.prisma.performHealthCheck();

    this.lastHealthCheck = new Date();

    return {
      connectionStatus,
      healthStatus,
      uptime: Date.now() - this.startTime,
      lastHealthCheck: this.lastHealthCheck,
    };
  }

  /**
   * Force a database reconnection
   */
  async forceReconnect(): Promise<void> {
    this.logger.warn('Force reconnecting to database', {}, 'ConnectionService');

    try {
      await this.prisma.reconnect();
      this.logger.info('Database reconnection successful', {}, 'ConnectionService');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Database reconnection failed: ' + errorMessage, 'ConnectionService');
      throw error;
    }
  }

  /**
   * Test database connectivity with custom query
   */
  async testConnection(testQuery?: string): Promise<{
    success: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      if (testQuery) {
        await this.prisma.$queryRawUnsafe(testQuery);
      } else {
        await this.prisma.$queryRaw`SELECT 1 as connection_test`;
      }

      return {
        success: true,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        latency: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Execute a query with retry logic
   */
  async executeWithRetry<T>(
    query: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await query();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logger.warn(
          `Query execution attempt ${attempt} failed`,
          {
            error: lastError.message,
            attempt,
            maxRetries,
            nextRetryIn: attempt < maxRetries ? delay : null,
          },
          'ConnectionService',
        );

        if (attempt === maxRetries) {
          break;
        }

        // Check if we should try to reconnect
        if (this.isConnectionError(lastError)) {
          try {
            await this.forceReconnect();
          } catch (reconnectError) {
            // Log reconnection failure but continue with retry
            this.logger.error(
              `Reconnection failed during retry attempt ${attempt}: ${
                reconnectError instanceof Error ? reconnectError.message : String(reconnectError)
              }`,
              'ConnectionService',
            );
          }
        }

        await this.sleep(delay * attempt); // Exponential backoff
      }
    }

    throw lastError!;
  }

  /**
   * Get connection pool statistics (if available)
   * Note: Prisma doesn't expose pool stats directly, so this is a placeholder
   * for future implementation or custom connection pool monitoring
   */
  getConnectionPoolStats(): ConnectionPoolStats {
    // This would need to be implemented based on the actual connection pool
    // Currently returning placeholder values
    return {
      activeConnections: 1, // Prisma manages this internally
      idleConnections: 0,
      pendingConnections: 0,
      totalConnections: 1,
    };
  }

  /**
   * Check if an error is connection-related
   */
  private isConnectionError(error: Error): boolean {
    const connectionErrorPatterns = [
      'connection',
      'timeout',
      'network',
      'unreachable',
      'refused',
      'reset',
      'closed',
      'disconnected',
    ];

    const message = error.message.toLowerCase();
    return connectionErrorPatterns.some((pattern) => message.includes(pattern));
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get database connection URL with masked credentials
   */
  getMaskedConnectionUrl(): string {
    try {
      const url = new URL(process.env.DATABASE_URL ?? '');
      if (url.password) {
        url.password = '***';
      }
      return url.toString();
    } catch {
      return 'Invalid DATABASE_URL';
    }
  }

  /**
   * Validate database configuration
   */
  validateConfiguration(): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!process.env.DATABASE_URL) {
      issues.push('DATABASE_URL environment variable is not set');
    }

    try {
      new URL(process.env.DATABASE_URL ?? '');
    } catch {
      issues.push('DATABASE_URL is not a valid URL');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
