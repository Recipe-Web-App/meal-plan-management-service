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
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
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
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap response data in ApiResponse format', (done) => {
    const testData = { id: 1, name: 'Test' };
    mockCallHandler.handle.mockReturnValue(of(testData));

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

  it('should handle null data', (done) => {
    mockCallHandler.handle.mockReturnValue(of(null));

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

  it('should handle undefined data', (done) => {
    mockCallHandler.handle.mockReturnValue(of(undefined));

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

  it('should handle array data', (done) => {
    const testData = [{ id: 1 }, { id: 2 }];
    mockCallHandler.handle.mockReturnValue(of(testData));

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

  it('should use correct request path', (done) => {
    mockRequest.url = '/api/v1/meal-plans';
    mockCallHandler.handle.mockReturnValue(of({}));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result$.subscribe((response) => {
      expect(response.path).toBe('/api/v1/meal-plans');
      done();
    });
  });
});
