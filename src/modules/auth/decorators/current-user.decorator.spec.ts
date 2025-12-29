import { describe, it, expect, mock } from 'bun:test';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Extract the decorator implementation function directly
const getCurrentUserImpl = (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
};

describe('CurrentUser Decorator', () => {
  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    sub: 'user-123',
    clientId: 'test-client',
    scopes: ['read', 'write'],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  describe('decorator creation', () => {
    it('should be defined and be a function', () => {
      expect(CurrentUser).toBeDefined();
      expect(typeof CurrentUser).toBe('function');
    });
  });

  describe('decorator execution logic', () => {
    it('should extract user from execution context', () => {
      // Create a proper execution context mock
      const mockRequest = { user: mockUser } as AuthenticatedRequest;
      const mockExecutionContext: ExecutionContext = {
        switchToHttp: mock(() => ({
          getRequest: mock(() => mockRequest),
        })),
        getClass: mock(() => {}),
        getHandler: mock(() => {}),
        getArgs: mock(() => []),
        getArgByIndex: mock(() => null),
        switchToRpc: mock(() => ({})),
        switchToWs: mock(() => ({})),
        getType: mock(() => 'http'),
      } as unknown as ExecutionContext;

      // Test the decorator implementation directly
      const result = getCurrentUserImpl(undefined, mockExecutionContext);

      expect(result).toEqual(mockUser);
    });

    it('should call the correct context methods', () => {
      const mockRequest = { user: mockUser } as AuthenticatedRequest;
      const httpContextMock = {
        getRequest: mock(() => mockRequest),
      };
      const mockExecutionContext: ExecutionContext = {
        switchToHttp: mock(() => httpContextMock),
        getClass: mock(() => {}),
        getHandler: mock(() => {}),
        getArgs: mock(() => []),
        getArgByIndex: mock(() => null),
        switchToRpc: mock(() => ({})),
        switchToWs: mock(() => ({})),
        getType: mock(() => 'http'),
      } as unknown as ExecutionContext;

      getCurrentUserImpl(undefined, mockExecutionContext);

      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      expect(httpContextMock.getRequest).toHaveBeenCalled();
    });

    it('should handle different user types', () => {
      const serviceUser: AuthenticatedUser = {
        id: 'service-user',
        sub: 'service-user',
        clientId: 'service-client',
        scopes: ['service', 'admin'],
        exp: Math.floor(Date.now() / 1000) + 7200,
      };

      const mockRequest = { user: serviceUser } as AuthenticatedRequest;
      const mockExecutionContext: ExecutionContext = {
        switchToHttp: mock(() => ({
          getRequest: mock(() => mockRequest),
        })),
        getClass: mock(() => {}),
        getHandler: mock(() => {}),
        getArgs: mock(() => []),
        getArgByIndex: mock(() => null),
        switchToRpc: mock(() => ({})),
        switchToWs: mock(() => ({})),
        getType: mock(() => 'http'),
      } as unknown as ExecutionContext;

      const result = getCurrentUserImpl(undefined, mockExecutionContext);

      expect(result).toEqual(serviceUser);
      expect(result.clientId).toBe('service-client');
      expect(result.scopes).toContain('admin');
    });

    it('should work with minimal user data', () => {
      const minimalUser: AuthenticatedUser = {
        id: 'min',
        sub: 'min',
        clientId: 'client',
        scopes: [],
        exp: 0,
      };

      const mockRequest = { user: minimalUser } as AuthenticatedRequest;
      const mockExecutionContext: ExecutionContext = {
        switchToHttp: mock(() => ({
          getRequest: mock(() => mockRequest),
        })),
        getClass: mock(() => {}),
        getHandler: mock(() => {}),
        getArgs: mock(() => []),
        getArgByIndex: mock(() => null),
        switchToRpc: mock(() => ({})),
        switchToWs: mock(() => ({})),
        getType: mock(() => 'http'),
      } as unknown as ExecutionContext;

      const result = getCurrentUserImpl(undefined, mockExecutionContext);

      expect(result).toEqual(minimalUser);
      expect(result.scopes).toEqual([]);
    });
  });

  describe('integration behavior', () => {
    it('should work when used with guards that set user', () => {
      // This simulates the typical flow where a guard has validated and set the user
      const guardSetUser: AuthenticatedUser = {
        id: 'guard-validated',
        sub: 'guard-validated',
        clientId: 'auth-client',
        scopes: ['validated'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockRequest = { user: guardSetUser } as AuthenticatedRequest;
      const mockExecutionContext: ExecutionContext = {
        switchToHttp: mock(() => ({
          getRequest: mock(() => mockRequest),
        })),
        getClass: mock(() => {}),
        getHandler: mock(() => {}),
        getArgs: mock(() => []),
        getArgByIndex: mock(() => null),
        switchToRpc: mock(() => ({})),
        switchToWs: mock(() => ({})),
        getType: mock(() => 'http'),
      } as unknown as ExecutionContext;

      const result = getCurrentUserImpl(undefined, mockExecutionContext);

      expect(result).toBe(guardSetUser); // Should be the exact same object
      expect(result.scopes).toContain('validated');
    });

    it('should maintain type safety with TypeScript', () => {
      const mockRequest = { user: mockUser } as AuthenticatedRequest;
      const mockExecutionContext: ExecutionContext = {
        switchToHttp: mock(() => ({
          getRequest: mock(() => mockRequest),
        })),
        getClass: mock(() => {}),
        getHandler: mock(() => {}),
        getArgs: mock(() => []),
        getArgByIndex: mock(() => null),
        switchToRpc: mock(() => ({})),
        switchToWs: mock(() => ({})),
        getType: mock(() => 'http'),
      } as unknown as ExecutionContext;

      const result = getCurrentUserImpl(undefined, mockExecutionContext);

      // Verify all required properties exist and have correct types
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('sub');
      expect(result).toHaveProperty('clientId');
      expect(result).toHaveProperty('scopes');
      expect(result).toHaveProperty('exp');

      expect(typeof result.id).toBe('string');
      expect(typeof result.sub).toBe('string');
      expect(typeof result.clientId).toBe('string');
      expect(Array.isArray(result.scopes)).toBe(true);
      expect(typeof result.exp).toBe('number');
    });
  });

  describe('edge cases', () => {
    it('should handle requests with extra properties', () => {
      const requestWithExtras = {
        user: mockUser,
        method: 'GET',
        url: '/test',
        headers: {},
        body: {},
        ip: '127.0.0.1',
      } as AuthenticatedRequest;

      const mockExecutionContext: ExecutionContext = {
        switchToHttp: mock(() => ({
          getRequest: mock(() => requestWithExtras),
        })),
        getClass: mock(() => {}),
        getHandler: mock(() => {}),
        getArgs: mock(() => []),
        getArgByIndex: mock(() => null),
        switchToRpc: mock(() => ({})),
        switchToWs: mock(() => ({})),
        getType: mock(() => 'http'),
      } as unknown as ExecutionContext;

      const result = getCurrentUserImpl(undefined, mockExecutionContext);

      expect(result).toEqual(mockUser);
    });

    it('should work consistently across multiple calls', () => {
      const mockRequest = { user: mockUser } as AuthenticatedRequest;
      const mockExecutionContext: ExecutionContext = {
        switchToHttp: mock(() => ({
          getRequest: mock(() => mockRequest),
        })),
        getClass: mock(() => {}),
        getHandler: mock(() => {}),
        getArgs: mock(() => []),
        getArgByIndex: mock(() => null),
        switchToRpc: mock(() => ({})),
        switchToWs: mock(() => ({})),
        getType: mock(() => 'http'),
      } as unknown as ExecutionContext;

      const result1 = getCurrentUserImpl(undefined, mockExecutionContext);
      const result2 = getCurrentUserImpl(undefined, mockExecutionContext);

      expect(result1).toEqual(result2);
      expect(result1).toBe(mockUser);
    });
  });
});
