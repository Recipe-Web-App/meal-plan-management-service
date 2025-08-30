import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RequestContextService } from './request-context.service';
import { Logger } from 'winston';

jest.mock('./request-context.service');

describe('LoggerService', () => {
  let service: LoggerService;
  let mockWinstonLogger: jest.Mocked<Logger>;
  let mockRequestContextService: jest.MockedClass<typeof RequestContextService>;

  beforeEach(async () => {
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      log: jest.fn(),
    } as any;

    mockRequestContextService = RequestContextService as jest.MockedClass<
      typeof RequestContextService
    >;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockWinstonLogger,
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('formatMessage', () => {
    it('should format message with context only', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.log('test message', 'TestContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('[TestContext] test message', {
        context: 'TestContext',
      });
    });

    it('should format message with correlation ID', () => {
      mockRequestContextService.getContext.mockReturnValue({
        correlationId: 'test-correlation-id',
      });

      service.log('test message', 'TestContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        '[test-correlation-id] [TestContext] test message',
        { context: 'TestContext', correlationId: 'test-correlation-id' },
      );
    });

    it('should format message with user ID and correlation ID', () => {
      mockRequestContextService.getContext.mockReturnValue({
        correlationId: 'test-correlation-id',
        userId: 'user123',
        ip: '127.0.0.1',
      });

      service.log('test message', 'TestContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        '[user:user123] [test-correlation-id] [TestContext] test message',
        {
          context: 'TestContext',
          correlationId: 'test-correlation-id',
          userId: 'user123',
          ip: '127.0.0.1',
        },
      );
    });

    it('should format message without context', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.log('test message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('test message', { context: undefined });
    });
  });

  describe('log', () => {
    it('should call winston info with formatted message', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.log('test message', 'TestContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('[TestContext] test message', {
        context: 'TestContext',
      });
    });
  });

  describe('error', () => {
    it('should call winston error with formatted message and trace', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.error('error message', 'stack trace', 'TestContext');

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('[TestContext] error message', {
        context: 'TestContext',
        trace: 'stack trace',
      });
    });

    it('should call winston error without trace', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.error('error message', undefined, 'TestContext');

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('[TestContext] error message', {
        context: 'TestContext',
        trace: undefined,
      });
    });
  });

  describe('warn', () => {
    it('should call winston warn with meta object', () => {
      mockRequestContextService.getContext.mockReturnValue(null);
      const meta = { customField: 'value' };

      service.warn('warning message', meta, 'TestContext');

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('[TestContext] warning message', {
        context: 'TestContext',
        customField: 'value',
      });
    });

    it('should handle string meta as context', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.warn('warning message', 'TestContext');

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('[TestContext] warning message', {
        context: 'TestContext',
      });
    });
  });

  describe('debug', () => {
    it('should call winston debug with meta object', () => {
      mockRequestContextService.getContext.mockReturnValue(null);
      const meta = { debugInfo: 'debug data' };

      service.debug('debug message', meta, 'TestContext');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('[TestContext] debug message', {
        context: 'TestContext',
        debugInfo: 'debug data',
      });
    });

    it('should handle string meta as context', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.debug('debug message', 'TestContext');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('[TestContext] debug message', {
        context: 'TestContext',
      });
    });
  });

  describe('verbose', () => {
    it('should call winston verbose with formatted message', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.verbose('verbose message', 'TestContext');

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith('[TestContext] verbose message', {
        context: 'TestContext',
      });
    });
  });

  describe('info', () => {
    it('should call winston info with meta object', () => {
      mockRequestContextService.getContext.mockReturnValue(null);
      const meta = { infoData: 'info value' };

      service.info('info message', meta, 'TestContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('[TestContext] info message', {
        context: 'TestContext',
        infoData: 'info value',
      });
    });
  });

  describe('getCorrelationId', () => {
    it('should return correlation ID from request context', () => {
      mockRequestContextService.getCorrelationId.mockReturnValue('test-correlation-id');

      const result = service.getCorrelationId();

      expect(result).toBe('test-correlation-id');
      expect(mockRequestContextService.getCorrelationId).toHaveBeenCalled();
    });

    it('should return undefined when no correlation ID', () => {
      mockRequestContextService.getCorrelationId.mockReturnValue(undefined);

      const result = service.getCorrelationId();

      expect(result).toBeUndefined();
    });
  });

  describe('logWithMeta', () => {
    it('should call winston log with custom level', () => {
      mockRequestContextService.getContext.mockReturnValue(null);
      const meta = { customField: 'value' };

      service.logWithMeta('silly', 'custom message', meta, 'TestContext');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('silly', '[TestContext] custom message', {
        context: 'TestContext',
        customField: 'value',
      });
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request with all parameters', () => {
      mockRequestContextService.getContext.mockReturnValue({
        correlationId: 'test-id',
      });

      service.logRequest('GET', '/api/test', 200, 150);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('GET /api/test 200 150ms', {
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        responseTime: 150,
        type: 'http_request',
        correlationId: 'test-id',
      });
    });

    it('should log HTTP request with minimal parameters', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.logRequest('POST', '/api/create');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('POST /api/create', {
        method: 'POST',
        url: '/api/create',
        statusCode: undefined,
        responseTime: undefined,
        type: 'http_request',
      });
    });
  });

  describe('logDatabaseOperation', () => {
    it('should log database operation with all parameters', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.logDatabaseOperation('SELECT', 'users', 25, 5);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Database SELECT on users (25ms) affected 5 rows',
        {
          operation: 'SELECT',
          table: 'users',
          duration: 25,
          affectedRows: 5,
          type: 'database_operation',
        },
      );
    });

    it('should log database operation with minimal parameters', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.logDatabaseOperation('INSERT', 'users');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Database INSERT on users', {
        operation: 'INSERT',
        table: 'users',
        duration: undefined,
        affectedRows: undefined,
        type: 'database_operation',
      });
    });

    it('should handle affected rows of 0', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.logDatabaseOperation('UPDATE', 'users', 10, 0);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Database UPDATE on users (10ms) affected 0 rows',
        {
          operation: 'UPDATE',
          table: 'users',
          duration: 10,
          affectedRows: 0,
          type: 'database_operation',
        },
      );
    });
  });

  describe('logExternalCall', () => {
    it('should log external service call with all parameters', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.logExternalCall('recipe-service', 'GET', '/api/recipes', 200, 300);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'External call to recipe-service: GET /api/recipes 200 300ms',
        {
          service: 'recipe-service',
          method: 'GET',
          url: '/api/recipes',
          statusCode: 200,
          duration: 300,
          type: 'external_call',
        },
      );
    });

    it('should log external service call with minimal parameters', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.logExternalCall('user-service', 'POST', '/api/users');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'External call to user-service: POST /api/users',
        {
          service: 'user-service',
          method: 'POST',
          url: '/api/users',
          statusCode: undefined,
          duration: undefined,
          type: 'external_call',
        },
      );
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event with details', () => {
      mockRequestContextService.getContext.mockReturnValue({
        userId: 'user123',
        ip: '192.168.1.1',
      });

      service.logSecurityEvent('failed_login', { attempts: 3, reason: 'invalid_password' });

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Security event: failed_login', {
        type: 'security_event',
        event: 'failed_login',
        attempts: 3,
        reason: 'invalid_password',
        userId: 'user123',
        ip: '192.168.1.1',
      });
    });

    it('should log security event without details', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.logSecurityEvent('unauthorized_access');

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Security event: unauthorized_access', {
        type: 'security_event',
        event: 'unauthorized_access',
      });
    });
  });

  describe('enrichMeta', () => {
    it('should enrich meta with request context data', () => {
      mockRequestContextService.getContext.mockReturnValue({
        correlationId: 'test-id',
        userId: 'user123',
        ip: '127.0.0.1',
      });

      service.info('test', { customField: 'value' });

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('[user:user123] [test-id] test', {
        context: undefined,
        customField: 'value',
        correlationId: 'test-id',
        userId: 'user123',
        ip: '127.0.0.1',
      });
    });

    it('should handle empty meta with request context', () => {
      mockRequestContextService.getContext.mockReturnValue({
        correlationId: 'test-id',
      });

      service.info('test');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('[test-id] test', {
        context: undefined,
        correlationId: 'test-id',
      });
    });

    it('should handle null request context', () => {
      mockRequestContextService.getContext.mockReturnValue(null);

      service.info('test', { field: 'value' });

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('test', {
        context: undefined,
        field: 'value',
      });
    });
  });
});
