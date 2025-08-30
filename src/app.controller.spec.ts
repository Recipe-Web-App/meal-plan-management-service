import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerService } from '@/shared/services/logger.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let mockLoggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      info: jest.fn(),
      logWithMeta: jest.fn(),
      logRequest: jest.fn(),
      logDatabaseOperation: jest.fn(),
      logExternalCall: jest.fn(),
      logSecurityEvent: jest.fn(),
      getCorrelationId: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
    mockLoggerService = app.get<LoggerService>(LoggerService) as jest.Mocked<LoggerService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const result = appController.getHello();
      expect(result).toBe('Hello World!');
    });

    it('should call logger.info with correct parameters', () => {
      appController.getHello();

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Hello endpoint called',
        { endpoint: '/meal-plan-management' },
        'AppController',
      );
    });

    it('should call logger.debug with result', () => {
      const result = appController.getHello();

      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        'Hello endpoint returning result',
        { result },
        'AppController',
      );
    });

    it('should call appService.getHello', () => {
      const getHelloSpy = jest.spyOn(appService, 'getHello');

      appController.getHello();

      expect(getHelloSpy).toHaveBeenCalled();
    });

    it('should log both info and debug messages', () => {
      appController.getHello();

      expect(mockLoggerService.info).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.debug).toHaveBeenCalledTimes(1);
    });
  });

  describe('testLogging', () => {
    it('should return logging test completion message', () => {
      mockLoggerService.getCorrelationId.mockReturnValue('test-correlation-id');

      const result = appController.testLogging();

      expect(result).toEqual({
        message: 'Logging test completed - check console and log files',
        correlationId: 'test-correlation-id',
      });
    });

    it('should return message with undefined correlationId when no correlation ID', () => {
      mockLoggerService.getCorrelationId.mockReturnValue(undefined);

      const result = appController.testLogging();

      expect(result).toEqual({
        message: 'Logging test completed - check console and log files',
        correlationId: undefined,
      });
    });

    it('should call all logging methods', () => {
      appController.testLogging();

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Testing logging functionality',
        {},
        'AppController',
      );

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'This is a warning message',
        { testData: 'sample' },
        'AppController',
      );

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'This is an error message',
        'Error stack trace here',
        'AppController',
      );
    });

    it('should call logWithMeta with structured data', () => {
      appController.testLogging();

      expect(mockLoggerService.logWithMeta).toHaveBeenCalledWith(
        'info',
        'Custom structured log',
        {
          customField: 'value',
          number: 42,
          nested: { data: 'test' },
        },
        'AppController',
      );
    });

    it('should call logRequest with HTTP request data', () => {
      appController.testLogging();

      expect(mockLoggerService.logRequest).toHaveBeenCalledWith('GET', '/test-logging', 200, 150);
    });

    it('should call logDatabaseOperation with database operation data', () => {
      appController.testLogging();

      expect(mockLoggerService.logDatabaseOperation).toHaveBeenCalledWith(
        'SELECT',
        'meal_plans',
        25,
        5,
      );
    });

    it('should call logExternalCall with external service call data', () => {
      appController.testLogging();

      expect(mockLoggerService.logExternalCall).toHaveBeenCalledWith(
        'recipe-service',
        'GET',
        '/api/recipes/123',
        200,
        350,
      );
    });

    it('should call logSecurityEvent with security event data', () => {
      appController.testLogging();

      expect(mockLoggerService.logSecurityEvent).toHaveBeenCalledWith('test_event', {
        source: 'logging_test',
      });
    });

    it('should call getCorrelationId to retrieve correlation ID', () => {
      appController.testLogging();

      expect(mockLoggerService.getCorrelationId).toHaveBeenCalled();
    });

    it('should call all logging methods in the correct sequence', () => {
      appController.testLogging();

      // Verify that all expected methods were called
      expect(mockLoggerService.info).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.warn).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.error).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.logWithMeta).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.logRequest).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.logDatabaseOperation).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.logExternalCall).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.logSecurityEvent).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.getCorrelationId).toHaveBeenCalledTimes(1);
    });
  });
});
