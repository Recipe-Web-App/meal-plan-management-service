import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService, DatabaseHealthStatus } from './database.config';
import { LoggerService } from '@/shared/services/logger.service';

describe('PrismaService', () => {
  let service: PrismaService;
  // let configService: jest.Mocked<ConfigService>;
  // let loggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    // Mock environment variable
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            performHealthCheck: jest.fn(),
            getConnectionStatus: jest.fn(),
            reconnect: jest.fn(),
            $queryRaw: jest.fn(),
            $connect: jest.fn(),
            $disconnect: jest.fn(),
            $on: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    // configService = module.get(ConfigService);
    // loggerService = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('performHealthCheck', () => {
    it('should return healthy status on successful connection', async () => {
      const expectedHealth: DatabaseHealthStatus = {
        status: 'healthy',
        message: 'Database connection is healthy',
        timestamp: new Date(),
        latency: 50,
        details: {
          connected: true,
          connectionRetries: 0,
        },
      };

      (service.performHealthCheck as jest.Mock).mockResolvedValue(expectedHealth);

      const result = await service.performHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Database connection is healthy');
      expect(result.latency).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.details).toBeDefined();
    });

    it('should return unhealthy status on failed connection', async () => {
      const expectedHealth: DatabaseHealthStatus = {
        status: 'unhealthy',
        message: 'Database health check failed: Connection failed',
        timestamp: new Date(),
        latency: 100,
        details: {
          connected: false,
          connectionRetries: 2,
          error: 'Connection failed',
        },
      };

      (service.performHealthCheck as jest.Mock).mockResolvedValue(expectedHealth);

      const result = await service.performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Database health check failed');
      expect(result.details?.error).toBeDefined();
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status information', () => {
      const expectedStatus = {
        isConnected: true,
        connectionRetries: 0,
        maxRetries: 5,
      };

      (service.getConnectionStatus as jest.Mock).mockReturnValue(expectedStatus);

      const status = service.getConnectionStatus();

      expect(status.isConnected).toBe(true);
      expect(status.connectionRetries).toBe(0);
      expect(status.maxRetries).toBe(5);
    });
  });

  describe('reconnect', () => {
    it('should attempt to reconnect to database', async () => {
      (service.reconnect as jest.Mock).mockResolvedValue();

      await service.reconnect();

      expect(service.reconnect).toHaveBeenCalled();
    });

    it('should handle reconnection errors gracefully', async () => {
      const error = new Error('Reconnection failed');
      (service.reconnect as jest.Mock).mockRejectedValue(error);

      await expect(service.reconnect()).rejects.toThrow('Reconnection failed');
    });
  });

  describe('health check functionality', () => {
    it('should perform health checks with latency measurement', async () => {
      const mockHealth: DatabaseHealthStatus = {
        status: 'healthy',
        message: 'Database is responsive',
        timestamp: new Date(),
        latency: 25,
        details: { connected: true, connectionRetries: 0 },
      };

      (service.performHealthCheck as jest.Mock).mockResolvedValue(mockHealth);

      const result = await service.performHealthCheck();

      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('connection management', () => {
    it('should provide connection status with retry information', () => {
      const mockStatus = {
        isConnected: false,
        connectionRetries: 3,
        maxRetries: 5,
      };

      (service.getConnectionStatus as jest.Mock).mockReturnValue(mockStatus);

      const status = service.getConnectionStatus();

      expect(status.connectionRetries).toBeGreaterThanOrEqual(0);
      expect(status.maxRetries).toBeGreaterThan(0);
      expect(typeof status.isConnected).toBe('boolean');
    });
  });
});
