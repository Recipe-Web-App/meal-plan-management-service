import { describe, it, expect, beforeEach, afterEach, mock, type Mock } from 'bun:test';
import { CorrelationIdInterceptor } from './correlation-id.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Request, Response } from 'express';
import { RequestContextService } from '@/shared/services/request-context.service';
import { v4 as uuidv4 } from 'uuid';

// Mock uuid
const mockUuidv4 = mock(() => 'generated-uuid');

// Mock RequestContextService.run
const mockRequestContextRun = mock((context: unknown, callback: () => unknown) => {
  return callback();
});

// Store original methods to restore later
const originalRun = RequestContextService.run;

describe('CorrelationIdInterceptor', () => {
  let interceptor: CorrelationIdInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: {
    headers: Record<string, string>;
    ip?: string;
    socket: { remoteAddress: string };
    correlationId?: string;
  };
  let mockResponse: {
    setHeader: Mock<() => void>;
  };

  beforeEach(() => {
    // Setup mocks
    (RequestContextService as any).run = mockRequestContextRun;

    // Reset mocks
    mockUuidv4.mockReturnValue('generated-uuid');

    interceptor = new CorrelationIdInterceptor();

    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      socket: {
        remoteAddress: '192.168.1.1',
      },
    };

    mockResponse = {
      setHeader: mock(() => {}),
    };

    mockExecutionContext = {
      switchToHttp: mock(() => ({
        getRequest: mock(() => mockRequest),
        getResponse: mock(() => mockResponse),
      })),
      getArgs: mock(() => []),
      getArgByIndex: mock(() => undefined),
      switchToRpc: mock(() => ({}) as any),
      switchToWs: mock(() => ({}) as any),
      getType: mock(() => 'http' as const),
      getClass: mock(() => Object),
      getHandler: mock(() => (() => {}) as any),
    };

    mockCallHandler = {
      handle: mock(() => of('test data')),
    };
  });

  afterEach(() => {
    // Restore original methods
    (RequestContextService as any).run = originalRun;

    mockUuidv4.mockClear();
    mockRequestContextRun.mockClear();
    mockResponse.setHeader.mockClear();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should generate correlation ID when not provided', (done: () => void) => {
    // Override the interceptor's uuid generation
    const originalUuid = require('uuid');
    const mockUuidModule = { ...originalUuid, v4: mockUuidv4 };

    const generatedId = 'generated-uuid';
    mockUuidv4.mockReturnValue(generatedId);
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((_response) => {
      expect(mockRequest.correlationId).toBeDefined();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(mockRequestContextRun).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: expect.any(String),
          ip: '127.0.0.1',
          userAgent: undefined,
        }),
        expect.any(Function),
      );
      done();
    });
  });

  it('should use existing correlation ID from header', (done: () => void) => {
    const existingId = 'existing-correlation-id';
    mockRequest.headers['x-correlation-id'] = existingId;
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((_response) => {
      expect(mockRequest.correlationId).toBe(existingId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', existingId);
      expect(mockRequestContextRun).toHaveBeenCalledWith(
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

  it('should include user agent in request context', (done: () => void) => {
    const userAgent = 'Mozilla/5.0';
    mockRequest.headers['user-agent'] = userAgent;
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe(() => {
      expect(mockRequestContextRun).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: userAgent,
        }),
        expect.any(Function),
      );
      done();
    });
  });

  it('should use socket remote address when request.ip is undefined', (done: () => void) => {
    delete mockRequest.ip;
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe(() => {
      expect(mockRequestContextRun).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '192.168.1.1',
        }),
        expect.any(Function),
      );
      done();
    });
  });

  it('should handle errors in the request pipeline', (done: () => void) => {
    const error = new Error('Test error');
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(
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

  it('should complete the observable', (done: () => void) => {
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of('test data'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe({
      next: (value) => expect(value).toBe('test data'),
      complete: () => done(),
    });
  });
});
