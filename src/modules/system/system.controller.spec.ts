import { describe, it, expect, beforeEach, afterEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

describe('SystemController', () => {
  let controller: SystemController;
  let service: SystemService;

  let mockSystemService: {
    getServiceInfo: Mock<() => unknown>;
    getConfiguration: Mock<() => unknown>;
  };

  beforeEach(async () => {
    mockSystemService = {
      getServiceInfo: mock(() => ({})),
      getConfiguration: mock(() => ({})),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        {
          provide: SystemService,
          useValue: mockSystemService,
        },
      ],
    }).compile();

    controller = module.get<SystemController>(SystemController);
    service = module.get<SystemService>(SystemService);
  });

  afterEach(() => {
    mockSystemService.getServiceInfo.mockClear();
    mockSystemService.getConfiguration.mockClear();
  });

  describe('getInfo', () => {
    it('should return service information', () => {
      const mockServiceInfo = {
        name: 'Meal Plan Management Service',
        version: '1.0.0',
        description: 'API for managing meal plans, recipes, and nutritional tracking',
        environment: 'test',
        uptime: 3600.5,
        timestamp: '2024-01-15T14:30:00Z',
        nodeVersion: 'v18.17.0',
        platform: 'linux',
        arch: 'x64',
        memory: {
          used: 45,
          total: 128,
          external: 12,
        },
        pid: 12345,
      };

      mockSystemService.getServiceInfo.mockReturnValue(mockServiceInfo);

      const result = controller.getInfo();

      expect(service.getServiceInfo).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceInfo);
    });

    it('should handle service errors', () => {
      const error = new Error('Service unavailable');
      mockSystemService.getServiceInfo.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.getInfo()).toThrow('Service unavailable');
      expect(service.getServiceInfo).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConfig', () => {
    it('should return safe configuration values', () => {
      const mockConfiguration = {
        environment: 'test',
        port: 3000,
        logLevel: 'info',
        corsOrigins: ['http://localhost:3000'],
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
          consoleFormat: 'pretty',
          fileEnabled: false,
          maxSize: '20m',
          maxFiles: '14d',
        },
      };

      mockSystemService.getConfiguration.mockReturnValue(mockConfiguration);

      const result = controller.getConfig();

      expect(service.getConfiguration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockConfiguration);
    });

    it('should handle configuration with undefined values', () => {
      const mockConfiguration = {
        environment: undefined,
        port: undefined,
        logLevel: 'debug',
        corsOrigins: [],
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
      };

      mockSystemService.getConfiguration.mockReturnValue(mockConfiguration);

      const result = controller.getConfig();

      expect(service.getConfiguration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockConfiguration);
    });

    it('should handle service errors', () => {
      const error = new Error('Configuration unavailable');
      mockSystemService.getConfiguration.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.getConfig()).toThrow('Configuration unavailable');
      expect(service.getConfiguration).toHaveBeenCalledTimes(1);
    });
  });

  describe('controller instantiation', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have SystemService injected', () => {
      expect(service).toBeDefined();
    });
  });

  describe('method signatures', () => {
    it('should have correct method signatures', () => {
      expect(typeof controller.getInfo).toBe('function');
      expect(typeof controller.getConfig).toBe('function');
    });
  });
});
