import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerService } from '@/shared/services/logger.service';
import { PrismaService } from '@/config/database.config';

describe('AppModule', () => {
  const mockLoggerService = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    performHealthCheck: jest.fn(),
    getConnectionStatus: jest.fn(),
  };

  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useValue(mockLoggerService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    expect(module).toBeDefined();
  });

  it('should have AppController', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useValue(mockLoggerService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    const controller = module.get(AppController);
    expect(controller).toBeDefined();
  });

  it('should have AppService', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useValue(mockLoggerService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    const service = module.get(AppService);
    expect(service).toBeDefined();
  });

  describe('providers', () => {
    it('should have all required providers available', async () => {
      const module = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(LoggerService)
        .useValue(mockLoggerService)
        .overrideProvider(PrismaService)
        .useValue(mockPrismaService)
        .compile();

      expect(module.get(LoggerService)).toBeDefined();
      expect(module.get(PrismaService)).toBeDefined();
      expect(module.get(ConfigService)).toBeDefined();
    });

    it('should handle rate limit config fallbacks', async () => {
      // Create a mock that returns null to test the nullish coalescing
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'rateLimit.ttl') return null;
          if (key === 'rateLimit.limit') return null;
          if (key === 'logging')
            return { level: 'info', consoleFormat: 'pretty', fileEnabled: false };
          return undefined;
        }),
      };

      const module = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(LoggerService)
        .useValue(mockLoggerService)
        .overrideProvider(PrismaService)
        .useValue(mockPrismaService)
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      expect(module).toBeDefined();
    });

    it('should handle rate limit config with undefined values', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'rateLimit.ttl') return undefined;
          if (key === 'rateLimit.limit') return undefined;
          if (key === 'logging')
            return { level: 'info', consoleFormat: 'pretty', fileEnabled: false };
          return undefined;
        }),
      };

      const module = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(LoggerService)
        .useValue(mockLoggerService)
        .overrideProvider(PrismaService)
        .useValue(mockPrismaService)
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      expect(module).toBeDefined();
    });
  });
});
