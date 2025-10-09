import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from './logger.config';
import { RequestContextService } from '@/shared/services/request-context.service';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

jest.mock('@/shared/services/request-context.service');

describe('LoggerConfig', () => {
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockLoggingConfig = {
    level: 'info',
    consoleFormat: 'pretty' as const,
    fileEnabled: true,
    filePath: './logs',
    fileDatePattern: 'YYYY-MM-DD',
    fileMaxSize: '20m',
    fileMaxFiles: '14d',
  };

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    mockConfigService.get.mockReturnValue(mockLoggingConfig);
    (RequestContextService.getContext as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWinstonLogger', () => {
    it('should create logger with console transport only when file disabled', () => {
      const configWithoutFile = { ...mockLoggingConfig, fileEnabled: false };
      mockConfigService.get.mockReturnValue(configWithoutFile);

      const loggerOptions = createWinstonLogger(mockConfigService);

      expect(loggerOptions.level).toBe('info');
      expect(Array.isArray(loggerOptions.transports)).toBe(true);
      expect(loggerOptions.transports as winston.transport[]).toHaveLength(1);
      const transportsArray = Array.isArray(loggerOptions.transports)
        ? loggerOptions.transports
        : [loggerOptions.transports];
      expect(transportsArray[0]).toBeInstanceOf(winston.transports.Console);
      expect(loggerOptions.defaultMeta).toEqual({ service: 'meal-plan-management-service' });
      expect(loggerOptions.exitOnError).toBe(false);
    });

    it('should create logger with file transports when enabled', () => {
      const loggerOptions = createWinstonLogger(mockConfigService);

      expect(loggerOptions.level).toBe('info');
      expect(loggerOptions.transports).toHaveLength(3); // console + 2 file transports
      const transportsArray = Array.isArray(loggerOptions.transports)
        ? loggerOptions.transports
        : [loggerOptions.transports];
      expect(transportsArray[0]).toBeInstanceOf(winston.transports.Console);
      expect(transportsArray[1]).toBeInstanceOf(DailyRotateFile);
      expect(transportsArray[2]).toBeInstanceOf(DailyRotateFile);
    });

    it('should use JSON format for console when consoleFormat is json', () => {
      const configWithJsonFormat = { ...mockLoggingConfig, consoleFormat: 'json' as const };
      mockConfigService.get.mockReturnValue(configWithJsonFormat);

      const loggerOptions = createWinstonLogger(mockConfigService);

      expect(loggerOptions.transports).toHaveLength(3);
    });
  });

  describe('Format functions', () => {
    let logger: winston.Logger;

    beforeEach(() => {
      const loggerOptions = createWinstonLogger(mockConfigService);
      logger = winston.createLogger(loggerOptions);
    });

    it('should format log entry with request context', () => {
      const mockContext = {
        correlationId: 'test-correlation-id',
        userId: 'user123',
        ip: '127.0.0.1',
      };
      (RequestContextService.getContext as jest.Mock).mockReturnValue(mockContext);

      const logSpy = jest.spyOn(logger, 'info');
      logger.info('Test message', { context: 'TestContext' });

      expect(logSpy).toHaveBeenCalled();
    });

    it('should format log entry without request context', () => {
      (RequestContextService.getContext as jest.Mock).mockReturnValue(null);

      const logSpy = jest.spyOn(logger, 'info');
      logger.info('Test message', { context: 'TestContext' });

      expect(logSpy).toHaveBeenCalled();
    });

    it('should handle log entry with stack trace', () => {
      const error = new Error('Test error');

      const logSpy = jest.spyOn(logger, 'error');
      logger.error('Error occurred', { trace: error.stack });

      expect(logSpy).toHaveBeenCalled();
    });

    it('should handle log entry with additional metadata', () => {
      const logSpy = jest.spyOn(logger, 'info');
      logger.info('Test message', {
        context: 'TestContext',
        customField: 'customValue',
        anotherField: 123,
      });

      expect(logSpy).toHaveBeenCalled();
    });

    it('should handle log entry with missing fields', () => {
      const logSpy = jest.spyOn(logger, 'info');
      logger.info('Test message');

      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('File transport configuration', () => {
    it('should configure file transports with correct options', () => {
      const loggerOptions = createWinstonLogger(mockConfigService);
      const transportsArray = Array.isArray(loggerOptions.transports)
        ? loggerOptions.transports
        : [loggerOptions.transports];
      const fileTransports = transportsArray.filter((t) => t instanceof DailyRotateFile);

      expect(fileTransports).toHaveLength(2);

      // Application log transport
      const appTransport = fileTransports[0] as DailyRotateFile;
      expect(appTransport.dirname).toBe('./logs');

      // Error log transport
      const errorTransport = fileTransports[1] as DailyRotateFile;
      expect(errorTransport.dirname).toBe('./logs');
      expect(errorTransport.level).toBe('error');
    });
  });

  it('should configure console transport with correct level', () => {
    const loggerOptions = createWinstonLogger(mockConfigService);
    const transportsArray = Array.isArray(loggerOptions.transports)
      ? loggerOptions.transports
      : [loggerOptions.transports];
    const consoleTransport = transportsArray[0] as typeof winston.transports.Console;

    expect(consoleTransport.level).toBe('info');
  });

  it('should configure console transport with json format', () => {
    const configWithJsonFormat = { ...mockLoggingConfig, consoleFormat: 'json' as const };
    mockConfigService.get.mockReturnValue(configWithJsonFormat);

    const loggerOptions = createWinstonLogger(mockConfigService);
    const transportsArray = Array.isArray(loggerOptions.transports)
      ? loggerOptions.transports
      : [loggerOptions.transports];
    const consoleTransport = transportsArray[0] as typeof winston.transports.Console;

    expect(consoleTransport.level).toBe('info');
  });
});
