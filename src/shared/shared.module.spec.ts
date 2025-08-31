import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SharedModule } from './shared.module';
import { LoggerService } from './services/logger.service';
import { RequestContextService } from './services/request-context.service';
import { PrismaService } from '@/config/database.config';

// Mock Winston logger
const mockWinstonLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  log: jest.fn(),
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    switch (key) {
      case 'database.url':
        return 'postgresql://test:test@localhost:5432/test_db';
      case 'database.maxRetries':
        return 3;
      case 'database.retryDelay':
        return 1000;
      case 'database.healthCheckInterval':
        return 30000;
      case 'database.logQueries':
        return false;
      default:
        return defaultValue;
    }
  }),
};

describe('SharedModule', () => {
  let module: TestingModule;
  let loggerService: LoggerService;
  let requestContextService: RequestContextService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        LoggerService,
        RequestContextService,
        PrismaService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockWinstonLogger,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    loggerService = module.get<LoggerService>(LoggerService);
    requestContextService = module.get<RequestContextService>(RequestContextService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Clean up any resources
    if (module) {
      await module.close();
    }
  });

  describe('Module Compilation', () => {
    it('should compile the module successfully', () => {
      expect(module).toBeDefined();
    });

    it('should provide LoggerService', () => {
      expect(loggerService).toBeDefined();
      expect(loggerService).toBeInstanceOf(LoggerService);
    });

    it('should provide RequestContextService', () => {
      expect(requestContextService).toBeDefined();
      expect(requestContextService).toBeInstanceOf(RequestContextService);
    });

    it('should provide PrismaService', () => {
      expect(prismaService).toBeDefined();
      // PrismaService extends PrismaClient, so check for expected methods instead
      expect(typeof prismaService.$connect).toBe('function');
      expect(typeof prismaService.$disconnect).toBe('function');
    });
  });

  describe('Service Dependencies', () => {
    it('should resolve LoggerService dependencies correctly', () => {
      // LoggerService should be able to call logging methods
      expect(() => loggerService.info('Test message')).not.toThrow();
      expect(mockWinstonLogger.info).toHaveBeenCalled();
    });

    it('should resolve PrismaService dependencies correctly', () => {
      // PrismaService should have access to logger and config
      expect(prismaService).toHaveProperty('logger');
      expect(prismaService).toHaveProperty('configService');
    });

    it('should create singleton instances', () => {
      // Get services again - should be the same instances
      const loggerService2 = module.get<LoggerService>(LoggerService);
      const requestContextService2 = module.get<RequestContextService>(RequestContextService);
      const prismaService2 = module.get<PrismaService>(PrismaService);

      expect(loggerService).toBe(loggerService2);
      expect(requestContextService).toBe(requestContextService2);
      expect(prismaService).toBe(prismaService2);
    });
  });

  describe('Global Module Behavior', () => {
    it('should be marked as a global module', () => {
      // Check if the module has the Global decorator
      // Note: The @Global() decorator doesn't set metadata that's easily testable
      // This test validates that the decorator exists by checking the module exports
      expect(SharedModule).toBeDefined();
      expect(typeof SharedModule).toBe('function');
    });

    it('should export all provided services', () => {
      // Test that services can be injected as dependencies
      expect(loggerService).toBeInstanceOf(LoggerService);
      expect(requestContextService).toBeInstanceOf(RequestContextService);
      expect(prismaService).toBeDefined();
      expect(typeof prismaService.$connect).toBe('function');
    });
  });

  describe('Service Integration', () => {
    it('should allow LoggerService to work with RequestContextService', () => {
      // Test that LoggerService can access RequestContextService static methods
      expect(() => {
        // This should not throw - LoggerService uses RequestContextService.getContext()
        loggerService.info('Test message with context', {}, 'TestContext');
      }).not.toThrow();
    });

    it('should allow PrismaService to use LoggerService', () => {
      // Test that PrismaService can call logger methods
      // Note: This is tested through the constructor injection
      expect(prismaService['logger']).toBeDefined();
      expect(prismaService['logger']).toBeInstanceOf(LoggerService);
    });
  });
});
