import { describe, it, expect, beforeEach, afterEach, mock, spyOn, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionService } from './connection.service';
import { PrismaService } from '@/config/database.config';
import { LoggerService } from '@/shared/services/logger.service';

describe('ConnectionService', () => {
  let service: ConnectionService;
  let prismaService: {
    performHealthCheck: Mock<() => Promise<unknown>>;
    getConnectionStatus: Mock<() => unknown>;
    reconnect: Mock<() => Promise<void>>;
    $queryRaw: Mock<() => Promise<unknown>>;
    $queryRawUnsafe: Mock<() => Promise<unknown>>;
  };
  let loggerService: {
    info: Mock<() => void>;
    warn: Mock<() => void>;
    error: Mock<() => void>;
    debug: Mock<() => void>;
  };

  beforeEach(async () => {
    prismaService = {
      performHealthCheck: mock(() => Promise.resolve({})),
      getConnectionStatus: mock(() => ({})),
      reconnect: mock(() => Promise.resolve()),
      $queryRaw: mock(() => Promise.resolve([])),
      $queryRawUnsafe: mock(() => Promise.resolve([])),
    };

    loggerService = {
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      debug: mock(() => {}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: LoggerService,
          useValue: loggerService,
        },
      ],
    }).compile();

    service = module.get<ConnectionService>(ConnectionService);
    prismaService = module.get(PrismaService) as typeof prismaService;
    loggerService = module.get(LoggerService) as typeof loggerService;
  });

  afterEach(() => {
    prismaService.performHealthCheck.mockClear();
    prismaService.getConnectionStatus.mockClear();
    prismaService.reconnect.mockClear();
    prismaService.$queryRaw.mockClear();
    prismaService.$queryRawUnsafe.mockClear();
    loggerService.info.mockClear();
    loggerService.warn.mockClear();
    loggerService.error.mockClear();
    loggerService.debug.mockClear();
  });

  describe('getDatabaseMetrics', () => {
    it('should return comprehensive database metrics', async () => {
      const mockHealthStatus = {
        status: 'healthy' as const,
        message: 'Database is healthy',
        timestamp: new Date(),
        latency: 50,
        details: {},
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

      const metrics = await service.getDatabaseMetrics();

      expect(metrics.healthStatus).toEqual(mockHealthStatus);
      expect(metrics.connectionStatus).toEqual(mockConnectionStatus);
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.lastHealthCheck).toBeInstanceOf(Date);
    });
  });

  describe('forceReconnect', () => {
    it('should successfully reconnect to database', async () => {
      prismaService.reconnect.mockResolvedValue(undefined);

      await service.forceReconnect();

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Force reconnecting to database',
        {},
        'ConnectionService',
      );
      expect(prismaService.reconnect).toHaveBeenCalled();
      expect(loggerService.info).toHaveBeenCalledWith(
        'Database reconnection successful',
        {},
        'ConnectionService',
      );
    });

    it('should handle reconnection failures', async () => {
      const error = new Error('Reconnection failed');
      prismaService.reconnect.mockRejectedValue(error);

      await expect(service.forceReconnect()).rejects.toThrow('Reconnection failed');

      expect(loggerService.error).toHaveBeenCalledWith(
        'Database reconnection failed: Reconnection failed',
        'ConnectionService',
      );
    });
  });

  describe('testConnection', () => {
    it('should test connection with default query', async () => {
      prismaService.$queryRaw.mockResolvedValue([{ connection_test: 1 }]);

      const result = await service.testConnection();

      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should test connection with custom query', async () => {
      const customQuery = 'SELECT current_timestamp';
      prismaService.$queryRawUnsafe.mockResolvedValue([{ current_timestamp: new Date() }]);

      const result = await service.testConnection(customQuery);

      expect(result.success).toBe(true);
      expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith(customQuery);
    });

    it('should handle connection test failures', async () => {
      const error = new Error('Query failed');
      prismaService.$queryRaw.mockRejectedValue(error);

      const result = await service.testConnection();

      expect(result.success).toBe(false);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.error).toBe('Query failed');
    });
  });

  describe('executeWithRetry', () => {
    it('should execute query successfully on first attempt', async () => {
      const mockQuery = mock(() => Promise.resolve('success'));

      const result = await service.executeWithRetry(mockQuery);

      expect(result).toBe('success');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockQuery = mock(() => Promise.reject(new Error('Temporary failure')));
      mockQuery.mockRejectedValueOnce(new Error('Temporary failure'));
      mockQuery.mockResolvedValue('success');

      const sleepSpy = spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      const result = await service.executeWithRetry(mockQuery, 3, 100);

      expect(result).toBe('success');
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(sleepSpy).toHaveBeenCalledWith(100);

      sleepSpy.mockRestore();
    });

    it('should attempt reconnection on connection errors', async () => {
      const connectionError = new Error('connection refused');
      const mockQuery = mock(() => Promise.reject(connectionError));
      mockQuery.mockRejectedValueOnce(connectionError);
      mockQuery.mockResolvedValue('success');

      const sleepSpy = spyOn(service as any, 'sleep').mockResolvedValue(undefined);
      prismaService.reconnect.mockResolvedValue(undefined);

      const result = await service.executeWithRetry(mockQuery, 3, 100);

      expect(result).toBe('success');
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(prismaService.reconnect).toHaveBeenCalled();

      sleepSpy.mockRestore();
    });

    it('should fail after maximum retries', async () => {
      const mockQuery = mock(() => Promise.reject(new Error('Persistent error')));
      const sleepSpy = spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      await expect(service.executeWithRetry(mockQuery, 2, 100)).rejects.toThrow('Persistent error');

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(loggerService.warn).toHaveBeenCalledTimes(2);

      sleepSpy.mockRestore();
    });

    it('should handle reconnection failures during retry', async () => {
      const connectionError = new Error('connection timeout');
      const reconnectError = new Error('reconnect failed');

      const mockQuery = mock(() => Promise.reject(connectionError));
      mockQuery.mockRejectedValueOnce(connectionError);
      mockQuery.mockResolvedValue('success');

      const sleepSpy = spyOn(service as any, 'sleep').mockResolvedValue(undefined);
      prismaService.reconnect.mockRejectedValue(reconnectError);

      const result = await service.executeWithRetry(mockQuery, 3, 100);

      expect(result).toBe('success');
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Reconnection failed during retry attempt'),
        'ConnectionService',
      );

      sleepSpy.mockRestore();
    });
  });

  describe('getConnectionPoolStats', () => {
    it('should return connection pool statistics', () => {
      const stats = service.getConnectionPoolStats();

      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('idleConnections');
      expect(stats).toHaveProperty('pendingConnections');
      expect(stats).toHaveProperty('totalConnections');
      expect(typeof stats.activeConnections).toBe('number');
    });
  });

  describe('getMaskedConnectionUrl', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should mask password in connection URL', () => {
      process.env = {
        ...originalEnv,
        DATABASE_URL: 'postgresql://user:secret123@localhost:5432/testdb', // pragma: allowlist secret
      };

      const maskedUrl = service.getMaskedConnectionUrl();

      expect(maskedUrl).toContain('postgresql://user:***@localhost:5432/testdb');
      expect(maskedUrl).not.toContain('secret123');
    });

    it('should handle URL without password', () => {
      process.env = {
        ...originalEnv,
        DATABASE_URL: 'postgresql://user@localhost:5432/testdb',
      };

      const maskedUrl = service.getMaskedConnectionUrl();

      expect(maskedUrl).toBe('postgresql://user@localhost:5432/testdb');
    });

    it('should handle invalid URL', () => {
      process.env = {
        ...originalEnv,
        DATABASE_URL: 'invalid-url',
      };

      const maskedUrl = service.getMaskedConnectionUrl();

      expect(maskedUrl).toBe('Invalid DATABASE_URL');
    });

    it('should handle missing DATABASE_URL', () => {
      process.env = { ...originalEnv };
      delete process.env.DATABASE_URL;

      const maskedUrl = service.getMaskedConnectionUrl();

      expect(maskedUrl).toBe('Invalid DATABASE_URL');
    });
  });

  describe('validateConfiguration', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should validate valid configuration', () => {
      process.env = {
        ...originalEnv,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/testdb', // pragma: allowlist secret
      };

      const result = service.validateConfiguration();

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing DATABASE_URL', () => {
      process.env = { ...originalEnv };
      delete process.env.DATABASE_URL;

      const result = service.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('DATABASE_URL environment variable is not set');
    });

    it('should detect invalid DATABASE_URL format', () => {
      process.env = {
        ...originalEnv,
        DATABASE_URL: 'not-a-valid-url',
      };

      const result = service.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('DATABASE_URL is not a valid URL');
    });
  });

  describe('isConnectionError', () => {
    it('should identify connection errors', () => {
      const connectionErrors = [
        new Error('connection refused'),
        new Error('network timeout'),
        new Error('connection reset'),
        new Error('host unreachable'),
        new Error('connection closed'),
      ];

      connectionErrors.forEach((error) => {
        expect((service as any).isConnectionError(error)).toBe(true);
      });
    });

    it('should not identify non-connection errors', () => {
      const nonConnectionErrors = [
        new Error('syntax error'),
        new Error('permission denied'),
        new Error('table not found'),
        new Error('constraint violation'),
      ];

      nonConnectionErrors.forEach((error) => {
        expect((service as any).isConnectionError(error)).toBe(false);
      });
    });
  });
});
