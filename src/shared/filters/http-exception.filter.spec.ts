import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: {
    status: Mock<() => typeof mockResponse>;
    json: Mock<() => void>;
  };
  let mockRequest: {
    url: string;
    method: string;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockRequest = {
      url: '/test',
      method: 'GET',
    };

    mockResponse = {
      status: mock(() => mockResponse),
      json: mock(() => {}),
    };

    mockArgumentsHost = {
      switchToHttp: mock(() => ({
        getResponse: mock(() => mockResponse),
        getRequest: mock(() => mockRequest),
      })),
      getArgs: mock(() => []),
      getArgByIndex: mock(() => undefined),
      switchToRpc: mock(() => ({}) as any),
      switchToWs: mock(() => ({}) as any),
      getType: mock(() => 'http' as const),
    };
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Test error',
      errors: ['Test error'],
      timestamp: expect.any(String),
      path: '/test',
    });
  });

  it('should handle non-HttpException', () => {
    const exception = new Error('Generic error');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
      errors: [],
      timestamp: expect.any(String),
      path: '/test',
    });
  });

  it('should handle unknown exception', () => {
    const exception = 'string error';

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
      errors: [],
      timestamp: expect.any(String),
      path: '/test',
    });
  });
});
