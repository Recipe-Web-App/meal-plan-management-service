import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
  HealthIndicatorResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@/config/database.config';
import * as v8 from 'v8';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database health check
      () => this.checkDatabase(),

      // Memory health check (using 90% of heap limit)
      () => this.memory.checkHeap('memory_heap', v8.getHeapStatistics().heap_size_limit * 0.9),

      // Disk health check (using 95% as threshold)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.95,
        }),
    ]);
  }

  @HealthCheck()
  async checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database connectivity check
      () => this.checkDatabase(),
    ]);
  }

  async checkReadinessGraceful(): Promise<HealthCheckResult> {
    try {
      // Attempt database check
      const dbStatus = await this.checkDatabase();

      // If database is healthy, return normal status
      if (dbStatus.database && dbStatus.database.status === 'up') {
        return {
          status: 'ok',
          info: dbStatus,
          error: {},
          details: dbStatus,
        };
      }

      // If database is down, return degraded but still 200
      return {
        status: 'ok', // Return ok status so HTTP 200 is sent
        info: {
          service: { status: 'up' },
          database: {
            status: 'down',
            message: 'Database is unavailable but service is running',
            degraded: true,
          },
        },
        error: {},
        details: dbStatus,
      };
    } catch (error) {
      // Even on error, return degraded status with 200
      return {
        status: 'ok', // Return ok status so HTTP 200 is sent
        info: {
          service: { status: 'up' },
          database: {
            status: 'down',
            message: error instanceof Error ? error.message : 'Database health check failed',
            degraded: true,
          },
        },
        error: {},
        details: {
          database: {
            status: 'down',
            message: error instanceof Error ? error.message : 'Database health check failed',
            connected: false,
          },
        },
      };
    }
  }

  @HealthCheck()
  async checkLiveness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Basic memory check
      () => this.memory.checkHeap('memory_heap', v8.getHeapStatistics().heap_size_limit * 0.9),
    ]);
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    const healthStatus = await this.prisma.performHealthCheck();
    const connectionStatus = this.prisma.getConnectionStatus();

    return {
      database: {
        status: healthStatus.status === 'healthy' ? ('up' as const) : ('down' as const),
        message: healthStatus.message,
        latency: healthStatus.latency,
        connected: connectionStatus.isConnected,
        connectionRetries: connectionStatus.connectionRetries,
        timestamp: healthStatus.timestamp.toISOString(),
      },
    };
  }

  getVersion(): { version: string; environment: string; timestamp: string } {
    return {
      version: '1.0.0',
      environment: this.configService.get<string>('app.nodeEnv') ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
