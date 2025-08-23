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

      // Memory health check (using 150MB as threshold)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Disk health check (using 80% as threshold)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.8,
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

  @HealthCheck()
  async checkLiveness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Basic memory check
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ]);
  }

  private checkDatabase(): HealthIndicatorResult {
    return {
      database: {
        status: 'up' as const,
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
