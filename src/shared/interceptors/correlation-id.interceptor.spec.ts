import { CorrelationIdInterceptor } from './correlation-id.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Request, Response } from 'express';
import { RequestContextService } from '@/shared/services/request-context.service';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');
jest.mock('@/shared/services/request-context.service');

describe('CorrelationIdInterceptor', () => {
  let interceptor: CorrelationIdInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new CorrelationIdInterceptor();

    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      socket: {
        remoteAddress: '192.168.1.1',
      },
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    };

    mockCallHandler = {
      handle: jest.fn(),
    };

    (RequestContextService.run as jest.Mock).mockImplementation((context, callback) => {
      callback();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should generate correlation ID when not provided', (done) => {
    const generatedId = 'generated-uuid';
    (uuidv4 as jest.Mock).mockReturnValue(generatedId);
    mockCallHandler.handle.mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((_response) => {
      expect(uuidv4).toHaveBeenCalled();
      expect(mockRequest.correlationId).toBe(generatedId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', generatedId);
      expect(RequestContextService.run).toHaveBeenCalledWith(
        {
          correlationId: generatedId,
          ip: '127.0.0.1',
          userAgent: undefined,
        },
        expect.any(Function),
      );
      done();
    });
  });

  it('should use existing correlation ID from header', (done) => {
    const existingId = 'existing-correlation-id';
    mockRequest.headers['x-correlation-id'] = existingId;
    mockCallHandler.handle.mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((_response) => {
      expect(uuidv4).not.toHaveBeenCalled();
      expect(mockRequest.correlationId).toBe(existingId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', existingId);
      expect(RequestContextService.run).toHaveBeenCalledWith(
        {
          correlationId: existingId,
          ip: '127.0.0.1',
          userAgent: undefined,
        },
        expect.any(Function),
      );
      done();
    });
  });

  it('should include user agent in request context', (done) => {
    const userAgent = 'Mozilla/5.0';
    mockRequest.headers['user-agent'] = userAgent;
    mockCallHandler.handle.mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe(() => {
      expect(RequestContextService.run).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: userAgent,
        }),
        expect.any(Function),
      );
      done();
    });
  });

  it('should use socket remote address when request.ip is undefined', (done) => {
    mockRequest.ip = undefined;
    mockCallHandler.handle.mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe(() => {
      expect(RequestContextService.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '192.168.1.1',
        }),
        expect.any(Function),
      );
      done();
    });
  });

  it('should handle errors in the request pipeline', (done) => {
    const error = new Error('Test error');
    mockCallHandler.handle.mockReturnValue(
      new Observable((subscriber) => {
        subscriber.error(error);
      }),
    );

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe({
      next: () => {},
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });

  it('should complete the observable', (done) => {
    mockCallHandler.handle.mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe({
      next: (value) => expect(value).toBe('test data'),
      complete: () => done(),
    });
  });
});
