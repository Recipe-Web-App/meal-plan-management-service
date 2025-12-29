import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { ResponseInterceptor } from './response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { Request } from 'express';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: Request;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();

    mockRequest = {
      url: '/test',
    } as Request;

    mockExecutionContext = {
      switchToHttp: mock(() => ({
        getRequest: mock(() => mockRequest),
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
      handle: mock(() => of({})) as Mock<() => any>,
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap response data in ApiResponse format', (done: () => void) => {
    const testData = { id: 1, name: 'Test' };
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of(testData));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((response) => {
      expect(response).toEqual({
        success: true,
        data: testData,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        path: '/test',
      });
      done();
    });
  });

  it('should handle null data', (done: () => void) => {
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of(null));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((response) => {
      expect(response).toEqual({
        success: true,
        data: null,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        path: '/test',
      });
      done();
    });
  });

  it('should handle undefined data', (done: () => void) => {
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of(undefined));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((response) => {
      expect(response).toEqual({
        success: true,
        data: undefined,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        path: '/test',
      });
      done();
    });
  });

  it('should handle array data', (done: () => void) => {
    const testData = [{ id: 1 }, { id: 2 }];
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of(testData));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((response) => {
      expect(response).toEqual({
        success: true,
        data: testData,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        path: '/test',
      });
      done();
    });
  });

  it('should use correct request path', (done: () => void) => {
    mockRequest.url = '/api/v1/meal-plans';
    (mockCallHandler.handle as Mock<() => any>).mockReturnValue(of({}));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((response) => {
      expect(response.path).toBe('/api/v1/meal-plans');
      done();
    });
  });
});
