/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '@/shared/services/logger.service';

export interface DatabaseHealthStatus {
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: Date;
  latency?: number;
  details?: Record<string, unknown>;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private isConnected = false;
  private connectionRetries = 0;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    const databaseUrl = configService.get<string>('database.url') ?? process.env.DATABASE_URL;

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
      errorFormat: 'colorless',
    });

    this.maxRetries = configService.get<number>('database.maxRetries', 5);
    this.retryDelay = configService.get<number>('database.retryDelay', 5000);

    this.setupEventListeners();
  }

  async onModuleInit() {
    await this.connectWithRetry();
    this.startHealthCheck();
  }

  async onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    await this.safeDisconnect();
  }

  private setupEventListeners() {
    this.$on('query', (e) => {
      if (this.configService.get<boolean>('database.logQueries', false)) {
        this.logger.debug(
          `Query executed: ${e.query} - Duration: ${e.duration}ms`,
          { query: e.query, duration: e.duration, params: e.params },
          'PrismaService',
        );
      }
    });

    this.$on('error', (e) => {
      this.logger.error(
        'Database error occurred',
        { error: e.message, target: e.target },
        'PrismaService',
      );
    });

    this.$on('warn', (e) => {
      this.logger.warn(
        'Database warning',
        { message: e.message, target: e.target },
        'PrismaService',
      );
    });
  }

  private async connectWithRetry(): Promise<void> {
    while (this.connectionRetries < this.maxRetries) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.connectionRetries = 0;

        this.logger.info(
          'Successfully connected to database',
          {
            attempt: this.connectionRetries + 1,
            maxRetries: this.maxRetries,
          },
          'PrismaService',
        );

        return;
      } catch (error) {
        this.connectionRetries++;
        const errorMessage = error instanceof Error ? error.message : String(error);

        this.logger.warn(
          `Database connection attempt ${this.connectionRetries} failed`,
          {
            error: errorMessage,
            attempt: this.connectionRetries,
            maxRetries: this.maxRetries,
            nextRetryIn: this.retryDelay,
          },
          'PrismaService',
        );

        if (this.connectionRetries >= this.maxRetries) {
          this.logger.error(
            'Failed to connect to database after maximum retries',
            { error: errorMessage, maxRetries: this.maxRetries },
            'PrismaService',
          );
          throw new Error(
            `Database connection failed after ${this.maxRetries} attempts: ${errorMessage}`,
          );
        }

        await this.sleep(this.retryDelay);
      }
    }
  }

  private async safeDisconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.$disconnect();
        this.isConnected = false;
        this.logger.info('Database disconnected successfully', {}, 'PrismaService');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        'Error during database disconnection',
        { error: errorMessage },
        'PrismaService',
      );
    }
  }

  private startHealthCheck(): void {
    const interval = this.configService.get<number>('database.healthCheckInterval', 30000);

    if (interval > 0) {
      this.healthCheckInterval = setInterval(() => {
        this.performHealthCheck().catch((error) => {
          this.logger.error(
            'Health check failed',
            { error: error instanceof Error ? error.message : String(error) },
            'PrismaService',
          );
        });
      }, interval);
    }
  }

  public async performHealthCheck(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now();

    try {
      // Simple query to test connection
      await this.$queryRaw`SELECT 1 as health_check`;

      const latency = Date.now() - startTime;

      const status: DatabaseHealthStatus = {
        status: 'healthy',
        message: 'Database connection is healthy',
        timestamp: new Date(),
        latency,
        details: {
          connected: this.isConnected,
          connectionRetries: this.connectionRetries,
        },
      };

      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const status: DatabaseHealthStatus = {
        status: 'unhealthy',
        message: `Database health check failed: ${errorMessage}`,
        timestamp: new Date(),
        latency: Date.now() - startTime,
        details: {
          connected: this.isConnected,
          connectionRetries: this.connectionRetries,
          error: errorMessage,
        },
      };

      return status;
    }
  }

  public async reconnect(): Promise<void> {
    this.logger.info('Attempting to reconnect to database', {}, 'PrismaService');

    await this.safeDisconnect();
    this.connectionRetries = 0;
    await this.connectWithRetry();
  }

  public getConnectionStatus(): {
    isConnected: boolean;
    connectionRetries: number;
    maxRetries: number;
  } {
    return {
      isConnected: this.isConnected,
      connectionRetries: this.connectionRetries,
      maxRetries: this.maxRetries,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
