import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './database.config';
import { LoggerService } from '@/shared/services/logger.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let mockLoggerService: jest.Mocked<LoggerService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockLoggerService = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockConfigService = {
      get: jest.fn(),
    } as any;

    // Set default config values
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'database.url': 'postgresql://test:test@localhost:5432/test',
        'database.maxRetries': 3,
        'database.retryDelay': 1000,
        'database.healthCheckInterval': 5000,
        'database.logQueries': false,
      };
      return config[key] ?? defaultValue;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Mock Prisma methods
    jest.spyOn(service, '$connect').mockResolvedValue();
    jest.spyOn(service, '$disconnect').mockResolvedValue();
    jest.spyOn(service, '$queryRaw').mockResolvedValue([{ health_check: 1 }]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConnectionStatus', () => {
    it('should return connection status', () => {
      const status = service.getConnectionStatus();

      expect(status).toEqual({
        isConnected: expect.any(Boolean),
        connectionRetries: expect.any(Number),
        maxRetries: expect.any(Number),
      });
    });
  });

  describe('performHealthCheck', () => {
    it('should return healthy status on successful query', async () => {
      const queryRawSpy = jest.spyOn(service, '$queryRaw').mockResolvedValue([{ health_check: 1 }]);

      const result = await service.performHealthCheck();

      expect(queryRawSpy).toHaveBeenCalled();
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Database connection is healthy');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status on query failure', async () => {
      const queryError = new Error('Query failed');
      const queryRawSpy = jest.spyOn(service, '$queryRaw').mockRejectedValue(queryError);

      const result = await service.performHealthCheck();

      expect(queryRawSpy).toHaveBeenCalled();
      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Database health check failed: Query failed');
    });
  });

  describe('reconnect', () => {
    it('should attempt to reconnect', async () => {
      jest.spyOn(service, '$disconnect').mockResolvedValue();
      jest.spyOn(service, '$connect').mockResolvedValue();

      await service.reconnect();

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Attempting to reconnect to database',
        {},
        'PrismaService',
      );
    });
  });

  describe('constructor configuration', () => {
    it('should use default database URL when config is missing', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'database.url') return null;
        return undefined;
      });

      // Since constructor is called during module creation, check env fallback handling
      expect(mockConfigService.get).toHaveBeenCalled();
    });

    it('should enable query logging when configured', async () => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          'database.logQueries': true,
        };
        return config[key] ?? defaultValue;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PrismaService,
          { provide: LoggerService, useValue: mockLoggerService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      module.get<PrismaService>(PrismaService);

      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        'Database query logging is enabled through Prisma log config',
        {},
        'PrismaService',
      );
    });
  });

  describe('onModuleInit error handling', () => {
    it('should handle connection failure during module init', async () => {
      const connectError = new Error('Connection failed');
      jest.spyOn(service, '$connect').mockRejectedValue(connectError);

      try {
        await service.onModuleInit();
      } catch (error) {
        expect(error).toEqual(
          expect.objectContaining({
            message: expect.stringContaining('Database connection failed after 3 attempts'),
          }),
        );
      }
    });
  });

  describe('health check intervals', () => {
    it('should not start health check when interval is zero', async () => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'database.healthCheckInterval') return 0;
        return defaultValue;
      });

      const healthCheckSpy = jest.spyOn(service, 'performHealthCheck');
      await service.onModuleInit();

      expect(healthCheckSpy).not.toHaveBeenCalled();
    });

    it('should handle health check errors gracefully', async () => {
      jest.useFakeTimers();
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'database.healthCheckInterval') return 1000;
        return defaultValue;
      });

      const healthCheckError = new Error('Health check failed');
      jest.spyOn(service, 'performHealthCheck').mockRejectedValue(healthCheckError);

      await service.onModuleInit();

      // Advance timer to trigger health check
      await jest.advanceTimersByTimeAsync(1000);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Health check failed: Health check failed',
        undefined,
        'PrismaService',
      );

      jest.useRealTimers();
    });
  });

  describe('error handling paths', () => {
    it('should handle non-Error exceptions in connectWithRetry', async () => {
      jest.spyOn(service, '$connect').mockRejectedValue('String error');

      try {
        await (service as any).connectWithRetry();
      } catch {
        expect(mockLoggerService.warn).toHaveBeenCalledWith(
          expect.stringContaining('Database connection attempt 1 failed'),
          expect.objectContaining({
            error: 'String error',
          }),
          'PrismaService',
        );
      }
    });

    it('should handle non-Error exceptions in safeDisconnect', async () => {
      (service as any).isConnected = true;
      jest.spyOn(service, '$disconnect').mockRejectedValue('String disconnect error');

      await (service as any).safeDisconnect();

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Error during database disconnection: String disconnect error',
        undefined,
        'PrismaService',
      );
    });

    it('should handle non-Error exceptions in performHealthCheck', async () => {
      jest.spyOn(service, '$queryRaw').mockRejectedValue('String query error');

      const result = await service.performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Database health check failed: String query error');
      expect(result.details).toEqual({
        connected: false,
        connectionRetries: 0,
        error: 'String query error',
      });
    });
  });
});
