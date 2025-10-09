import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckService,
  HealthCheckResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { HealthService } from './health.service';
import { PrismaService } from '@/config/database.config';

describe('HealthService', () => {
  let service: HealthService;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  const mockHealthResult: HealthCheckResult = {
    status: 'ok',
    info: {},
    error: {},
    details: {},
  };

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn(),
    };

    const mockMemoryIndicator = {
      checkHeap: jest.fn(),
    };

    const mockDiskIndicator = {
      checkStorage: jest.fn(),
    };

    const mockPrismaService = {
      performHealthCheck: jest.fn(),
      getConnectionStatus: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: MemoryHealthIndicator, useValue: mockMemoryIndicator },
        { provide: DiskHealthIndicator, useValue: mockDiskIndicator },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    healthCheckService = module.get(HealthCheckService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should perform comprehensive health check', async () => {
      healthCheckService.check.mockResolvedValue(mockHealthResult);
      prismaService.performHealthCheck.mockResolvedValue({
        status: 'healthy',
        message: 'Database is healthy',
        latency: 10,
        timestamp: new Date(),
      });
      prismaService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        connectionRetries: 0,
        maxRetries: 5,
        isInLongRetryPhase: false,
        enableContinuousRetry: true,
      });

      const result = await service.check();

      expect(result).toBe(mockHealthResult);
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      ]);
    });
  });

  describe('checkReadiness', () => {
    it('should perform readiness check', async () => {
      healthCheckService.check.mockResolvedValue(mockHealthResult);
      prismaService.performHealthCheck.mockResolvedValue({
        status: 'healthy',
        message: 'Database is healthy',
        latency: 10,
        timestamp: new Date(),
      });
      prismaService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        connectionRetries: 0,
        maxRetries: 5,
        isInLongRetryPhase: false,
        enableContinuousRetry: true,
      });

      const result = await service.checkReadiness();

      expect(result).toBe(mockHealthResult);
      expect(healthCheckService.check).toHaveBeenCalledWith([expect.any(Function)]);
    });
  });

  describe('checkReadinessGraceful', () => {
    it('should return ok status when database is healthy', async () => {
      prismaService.performHealthCheck.mockResolvedValue({
        status: 'healthy',
        message: 'Database is healthy',
        latency: 10,
        timestamp: new Date(),
      });
      prismaService.getConnectionStatus.mockReturnValue({
        isConnected: true,
        connectionRetries: 0,
        maxRetries: 5,
        isInLongRetryPhase: false,
        enableContinuousRetry: true,
      });

      const result = await service.checkReadinessGraceful();

      expect(result.status).toBe('ok');
      expect(result.info?.database?.status).toBe('up');
    });

    it('should return ok status with degraded info when database is down', async () => {
      prismaService.performHealthCheck.mockResolvedValue({
        status: 'unhealthy',
        message: 'Database connection failed',
        latency: 1000,
        timestamp: new Date(),
      });
      prismaService.getConnectionStatus.mockReturnValue({
        isConnected: false,
        connectionRetries: 3,
        maxRetries: 5,
        isInLongRetryPhase: false,
        enableContinuousRetry: true,
      });

      const result = await service.checkReadinessGraceful();

      expect(result.status).toBe('ok'); // Still returns ok for 200 status
      expect(result.info?.service?.status).toBe('up');
      expect(result.info?.database?.status).toBe('down');
      expect(result.info?.database?.degraded).toBe(true);
    });

    it('should handle database check exceptions gracefully', async () => {
      prismaService.performHealthCheck.mockRejectedValue(new Error('Connection timeout'));

      const result = await service.checkReadinessGraceful();

      expect(result.status).toBe('ok'); // Still returns ok for 200 status
      expect(result.info?.service?.status).toBe('up');
      expect(result.info?.database?.status).toBe('down');
      expect(result.info?.database?.message).toBe('Connection timeout');
      expect(result.info?.database?.degraded).toBe(true);
    });
  });

  describe('checkLiveness', () => {
    it('should perform liveness check', async () => {
      healthCheckService.check.mockResolvedValue(mockHealthResult);

      const result = await service.checkLiveness();

      expect(result).toBe(mockHealthResult);
      expect(healthCheckService.check).toHaveBeenCalledWith([expect.any(Function)]);
    });
  });

  describe('checkDatabase', () => {
    it('should return healthy database status', async () => {
      const mockHealthStatus = {
        status: 'healthy' as const,
        message: 'Database is healthy',
        latency: 10,
        timestamp: new Date('2023-01-01T00:00:00Z'),
      };
      const mockConnectionStatus = {
        isConnected: true,
        connectionRetries: 0,
        maxRetries: 5,
        isInLongRetryPhase: false,
        enableContinuousRetry: true,
      };

      prismaService.performHealthCheck.mockResolvedValue(mockHealthStatus);
      prismaService.getConnectionStatus.mockReturnValue(mockConnectionStatus);

      // Access private method through any cast
      const result = await (service as any).checkDatabase();

      expect(result).toEqual({
        database: {
          status: 'up',
          message: 'Database is healthy',
          latency: 10,
          connected: true,
          connectionRetries: 0,
          timestamp: '2023-01-01T00:00:00.000Z',
        },
      });
    });

    it('should return unhealthy database status', async () => {
      const mockHealthStatus = {
        status: 'unhealthy' as const,
        message: 'Database connection failed',
        latency: 1000,
        timestamp: new Date('2023-01-01T00:00:00Z'),
      };
      const mockConnectionStatus = {
        isConnected: false,
        connectionRetries: 3,
        maxRetries: 5,
        isInLongRetryPhase: false,
        enableContinuousRetry: true,
      };

      prismaService.performHealthCheck.mockResolvedValue(mockHealthStatus);
      prismaService.getConnectionStatus.mockReturnValue(mockConnectionStatus);

      const result = await (service as any).checkDatabase();

      expect(result).toEqual({
        database: {
          status: 'down',
          message: 'Database connection failed',
          latency: 1000,
          connected: false,
          connectionRetries: 3,
          timestamp: '2023-01-01T00:00:00.000Z',
        },
      });
    });
  });

  describe('getVersion', () => {
    it('should return version info with environment from config', () => {
      configService.get.mockReturnValue('production');

      const result = service.getVersion();

      expect(result.version).toBe('1.0.0');
      expect(result.environment).toBe('production');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(configService.get).toHaveBeenCalledWith('app.nodeEnv');
    });

    it('should return default environment when config is null', () => {
      configService.get.mockReturnValue(null);

      const result = service.getVersion();

      expect(result.environment).toBe('development');
    });
  });
});
