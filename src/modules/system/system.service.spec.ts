import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SystemService } from './system.service';

describe('SystemService', () => {
  let service: SystemService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SystemService>(SystemService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getServiceInfo', () => {
    it('should return complete service information', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'development';
        return undefined;
      });

      const originalUptime = process.uptime;
      const originalVersion = process.version;
      const originalPlatform = process.platform;
      const originalArch = process.arch;
      const originalPid = process.pid;
      const originalMemoryUsage = process.memoryUsage;

      process.uptime = jest.fn().mockReturnValue(3600.5);
      Object.defineProperty(process, 'version', { value: 'v18.17.0', configurable: true });
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
      Object.defineProperty(process, 'arch', { value: 'x64', configurable: true });
      Object.defineProperty(process, 'pid', { value: 12345, configurable: true });
      (process.memoryUsage as any) = jest.fn().mockReturnValue({
        heapUsed: 47185920, // 45MB
        heapTotal: 134217728, // 128MB
        external: 12582912, // 12MB
        arrayBuffers: 0,
        rss: 0,
      });

      const result = service.getServiceInfo();

      expect(result).toEqual({
        name: 'Meal Plan Management Service',
        version: '1.0.0',
        description: 'API for managing meal plans, recipes, and nutritional tracking',
        environment: 'development',
        uptime: 3600.5,
        timestamp: expect.any(String),
        nodeVersion: 'v18.17.0',
        platform: 'linux',
        arch: 'x64',
        memory: {
          used: 45,
          total: 128,
          external: 12,
        },
        pid: 12345,
      });

      expect(configService.get).toHaveBeenCalledWith('app.nodeEnv');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Restore original values
      process.uptime = originalUptime;
      Object.defineProperty(process, 'version', { value: originalVersion, configurable: true });
      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
      Object.defineProperty(process, 'arch', { value: originalArch, configurable: true });
      Object.defineProperty(process, 'pid', { value: originalPid, configurable: true });
      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle undefined environment', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = service.getServiceInfo();

      expect(result.environment).toBeUndefined();
      expect(result.name).toBe('Meal Plan Management Service');
    });

    it('should calculate memory correctly', () => {
      mockConfigService.get.mockReturnValue('test');

      const originalMemoryUsage = process.memoryUsage;
      (process.memoryUsage as any) = jest.fn().mockReturnValue({
        heapUsed: 1048576, // 1MB
        heapTotal: 2097152, // 2MB
        external: 524288, // 0.5MB
        arrayBuffers: 0,
        rss: 0,
      });

      const result = service.getServiceInfo();

      expect(result.memory).toEqual({
        used: 1,
        total: 2,
        external: 1, // Rounded up from 0.5
      });

      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('getConfiguration', () => {
    it('should return complete safe configuration', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'app.nodeEnv': 'production',
          'app.port': 3000,
          'app.logLevel': 'info',
          'app.corsOrigins': ['https://app.example.com'],
          'rateLimit.ttl': 60000,
          'rateLimit.limit': 100,
          'database.maxRetries': 5,
          'database.retryDelay': 5000,
          'database.healthCheckInterval': 30000,
          'database.logQueries': false,
          'oauth2.serviceEnabled': true,
          'oauth2.serviceToServiceEnabled': true,
          'oauth2.introspectionEnabled': false,
          'oauth2.clientId': 'meal-plan-service',
          'logging.level': 'info',
          'logging.consoleFormat': 'json',
          'logging.fileEnabled': true,
          'logging.maxSize': '50m',
          'logging.maxFiles': '30d',
        };
        return (config as Record<string, any>)[key];
      });

      const result = service.getConfiguration();

      expect(result).toEqual({
        environment: 'production',
        port: 3000,
        logLevel: 'info',
        corsOrigins: ['https://app.example.com'],
        rateLimit: {
          ttl: 60000,
          limit: 100,
        },
        database: {
          maxRetries: 5,
          retryDelay: 5000,
          healthCheckInterval: 30000,
          logQueries: false,
        },
        oauth2: {
          serviceEnabled: true,
          serviceToServiceEnabled: true,
          introspectionEnabled: false,
          clientId: 'meal-plan-service',
        },
        logging: {
          level: 'info',
          consoleFormat: 'json',
          fileEnabled: true,
          maxSize: '50m',
          maxFiles: '30d',
        },
      });
    });

    it('should return undefined for missing configuration values', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = service.getConfiguration();

      expect(result).toEqual({
        environment: undefined,
        port: undefined,
        logLevel: undefined,
        corsOrigins: undefined,
        rateLimit: {
          ttl: undefined,
          limit: undefined,
        },
        database: {
          maxRetries: undefined,
          retryDelay: undefined,
          healthCheckInterval: undefined,
          logQueries: undefined,
        },
        oauth2: {
          serviceEnabled: undefined,
          serviceToServiceEnabled: undefined,
          introspectionEnabled: undefined,
          clientId: undefined,
        },
        logging: {
          level: undefined,
          consoleFormat: undefined,
          fileEnabled: undefined,
          maxSize: undefined,
          maxFiles: undefined,
        },
      });
    });

    it('should return partial configuration when some values are missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'app.nodeEnv': 'development',
          'app.port': 3001,
          'rateLimit.ttl': 30000,
          'oauth2.serviceEnabled': false,
          'logging.level': 'debug',
        };
        return (config as Record<string, any>)[key];
      });

      const result = service.getConfiguration();

      expect(result.environment).toBe('development');
      expect(result.port).toBe(3001);
      expect(result.logLevel).toBeUndefined();
      expect(result.corsOrigins).toBeUndefined();
      expect(result.rateLimit.ttl).toBe(30000);
      expect(result.rateLimit.limit).toBeUndefined();
      expect(result.oauth2.serviceEnabled).toBe(false);
      expect(result.oauth2.clientId).toBeUndefined();
      expect(result.logging.level).toBe('debug');
      expect(result.logging.fileEnabled).toBeUndefined();
    });

    it('should handle boolean configuration values correctly', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'database.logQueries': true,
          'oauth2.serviceEnabled': false,
          'oauth2.serviceToServiceEnabled': true,
          'oauth2.introspectionEnabled': false,
          'logging.fileEnabled': true,
        };
        return (config as Record<string, any>)[key];
      });

      const result = service.getConfiguration();

      expect(result.database.logQueries).toBe(true);
      expect(result.oauth2.serviceEnabled).toBe(false);
      expect(result.oauth2.serviceToServiceEnabled).toBe(true);
      expect(result.oauth2.introspectionEnabled).toBe(false);
      expect(result.logging.fileEnabled).toBe(true);
    });

    it('should handle array configuration values correctly', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'app.corsOrigins': ['http://localhost:3000', 'https://app.example.com'],
        };
        return (config as Record<string, any>)[key];
      });

      const result = service.getConfiguration();

      expect(result.corsOrigins).toEqual(['http://localhost:3000', 'https://app.example.com']);
    });

    it('should handle empty array configuration values', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'app.corsOrigins': [],
        };
        return (config as Record<string, any>)[key];
      });

      const result = service.getConfiguration();

      expect(result.corsOrigins).toEqual([]);
    });
  });

  describe('service instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have ConfigService injected', () => {
      expect(configService).toBeDefined();
    });
  });

  describe('method signatures', () => {
    it('should have correct method signatures', () => {
      expect(typeof service.getServiceInfo).toBe('function');
      expect(typeof service.getConfiguration).toBe('function');
    });
  });

  describe('data consistency', () => {
    it('should generate timestamp in correct ISO format', () => {
      mockConfigService.get.mockReturnValue('test');

      const result = service.getServiceInfo();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return consistent data on multiple calls', () => {
      mockConfigService.get.mockReturnValue('test');

      const result1 = service.getConfiguration();
      const result2 = service.getConfiguration();

      expect(result1).toEqual(result2);
    });
  });
});
