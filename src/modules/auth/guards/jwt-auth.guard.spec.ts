import { describe, it, expect, beforeEach, mock, spyOn, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OAuth2Config } from '../../../config/configuration';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let configService: { get: Mock<(key: string) => unknown> };

  const mockOAuth2Config: OAuth2Config = {
    enabled: true,
    serviceToServiceEnabled: true,
    introspectionEnabled: false,
    clientId: 'test-client',
    clientSecret: 'test-secret', // pragma: allowlist secret
    introspectionCacheTTL: 300000,
  };

  const mockUser: AuthenticatedUser = {
    id: 'test-user-id',
    sub: 'test-user-id',
    clientId: 'test-client',
    scopes: ['read', 'write'],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const createMockExecutionContext = (): ExecutionContext =>
    ({
      switchToHttp: mock(() => ({
        getRequest: mock(() => ({})),
        getResponse: mock(() => ({})),
      })),
      getClass: mock(() => {}),
      getHandler: mock(() => {}),
      getArgs: mock(() => []),
      getArgByIndex: mock(() => null),
      switchToRpc: mock(() => ({})),
      switchToWs: mock(() => ({})),
      getType: mock(() => 'http'),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockConfigService = {
      get: mock(() => null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    configService = module.get(ConfigService) as typeof configService;
  });

  describe('canActivate', () => {
    it('should return true when OAuth2 is disabled', async () => {
      const disabledConfig: OAuth2Config = { ...mockOAuth2Config, enabled: false };
      configService.get.mockReturnValue(disabledConfig);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('oauth2');
    });

    it('should call super.canActivate when OAuth2 is enabled', async () => {
      configService.get.mockReturnValue(mockOAuth2Config);
      const superCanActivateSpy = spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      ).mockResolvedValue(true);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
      expect(configService.get).toHaveBeenCalledWith('oauth2');
    });

    it('should handle undefined OAuth2 config', async () => {
      configService.get.mockReturnValue(undefined);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle null OAuth2 config', async () => {
      configService.get.mockReturnValue(null);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    let context: ExecutionContext;

    beforeEach(() => {
      context = createMockExecutionContext();
    });

    describe('when OAuth2 is disabled', () => {
      beforeEach(() => {
        const disabledConfig: OAuth2Config = { ...mockOAuth2Config, enabled: false };
        configService.get.mockReturnValue(disabledConfig);
      });

      it('should return a mock user', () => {
        const result = guard.handleRequest(null, null, undefined, context);

        expect(result).toEqual({
          id: 'mock-user-id',
          sub: 'mock-user-id',
          clientId: 'mock-client',
          scopes: ['read', 'write'],
          exp: expect.any(Number),
        });
        expect(result.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      });

      it('should return mock user even when there is an error', () => {
        const error = new Error('Test error');
        const result = guard.handleRequest(error, null, undefined, context);

        expect(result).toEqual({
          id: 'mock-user-id',
          sub: 'mock-user-id',
          clientId: 'mock-client',
          scopes: ['read', 'write'],
          exp: expect.any(Number),
        });
      });

      it('should return mock user even when user is provided', () => {
        const result = guard.handleRequest(null, mockUser, undefined, context);

        expect(result).toEqual({
          id: 'mock-user-id',
          sub: 'mock-user-id',
          clientId: 'mock-client',
          scopes: ['read', 'write'],
          exp: expect.any(Number),
        });
      });
    });

    describe('when OAuth2 is enabled', () => {
      beforeEach(() => {
        configService.get.mockReturnValue(mockOAuth2Config);
      });

      it('should throw error when error is provided', () => {
        const error = new Error('Authentication failed');

        expect(() => {
          guard.handleRequest(error, null, undefined, context);
        }).toThrow('Authentication failed');
      });

      it('should throw UnauthorizedException when no user is provided', () => {
        expect(() => {
          guard.handleRequest(null, null, undefined, context);
        }).toThrow(UnauthorizedException);
        expect(() => {
          guard.handleRequest(null, null, undefined, context);
        }).toThrow('Authentication failed');
      });

      it('should return user when valid user is provided', () => {
        const result = guard.handleRequest(null, mockUser, undefined, context);

        expect(result).toEqual(mockUser);
      });

      it('should handle custom error types', () => {
        const customError = new UnauthorizedException('Custom auth error');

        expect(() => {
          guard.handleRequest(customError, null, undefined, context);
        }).toThrow(UnauthorizedException);
        expect(() => {
          guard.handleRequest(customError, null, undefined, context);
        }).toThrow('Custom auth error');
      });
    });

    describe('edge cases', () => {
      it('should handle undefined OAuth2 config gracefully', () => {
        configService.get.mockReturnValue(undefined);

        const result = guard.handleRequest(null, null, undefined, context);

        expect(result).toEqual({
          id: 'mock-user-id',
          sub: 'mock-user-id',
          clientId: 'mock-client',
          scopes: ['read', 'write'],
          exp: expect.any(Number),
        });
      });

      it('should handle null OAuth2 config gracefully', () => {
        configService.get.mockReturnValue(null);

        const result = guard.handleRequest(null, null, undefined, context);

        expect(result).toEqual({
          id: 'mock-user-id',
          sub: 'mock-user-id',
          clientId: 'mock-client',
          scopes: ['read', 'write'],
          exp: expect.any(Number),
        });
      });

      it('should handle OAuth2 config without enabled property', () => {
        const configWithoutEnabled = { ...mockOAuth2Config };
        delete (configWithoutEnabled as any).enabled;
        configService.get.mockReturnValue(configWithoutEnabled);

        const result = guard.handleRequest(null, null, undefined, context);

        expect(result).toEqual({
          id: 'mock-user-id',
          sub: 'mock-user-id',
          clientId: 'mock-client',
          scopes: ['read', 'write'],
          exp: expect.any(Number),
        });
      });
    });
  });

  describe('type safety', () => {
    it('should properly type the return value of handleRequest', () => {
      configService.get.mockReturnValue(mockOAuth2Config);
      const context = createMockExecutionContext();

      const result = guard.handleRequest(null, mockUser, undefined, context);

      // TypeScript compilation will verify this is properly typed
      expect(result.id).toBe('test-user-id');
      expect(result.sub).toBe('test-user-id');
      expect(result.clientId).toBe('test-client');
      expect(result.scopes).toEqual(['read', 'write']);
      expect(result.exp).toBe(mockUser.exp);
    });
  });
});
