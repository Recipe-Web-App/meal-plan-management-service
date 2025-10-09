import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ServiceAuthGuard } from './service-auth.guard';
import { TokenValidationService } from '../services/token-validation.service';
import { OAuth2Config } from '../../../config/configuration';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

describe('ServiceAuthGuard', () => {
  let guard: ServiceAuthGuard;
  let configService: jest.Mocked<ConfigService>;
  let tokenValidationService: jest.Mocked<TokenValidationService>;

  const mockOAuth2Config: OAuth2Config = {
    enabled: true,
    serviceToServiceEnabled: true,
    introspectionEnabled: false,
    clientId: 'test-client',
    clientSecret: 'test-secret', // pragma: allowlist secret
    introspectionCacheTTL: 300000,
  };

  const mockUser: AuthenticatedUser = {
    id: 'service-user-id',
    sub: 'service-user-id',
    clientId: 'service-client',
    scopes: ['read', 'write'],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockUserWithReadOnly: AuthenticatedUser = {
    ...mockUser,
    scopes: ['read'],
  };

  const mockUserWithWriteOnly: AuthenticatedUser = {
    ...mockUser,
    scopes: ['write'],
  };

  const mockUserWithoutScopes: AuthenticatedUser = {
    ...mockUser,
    scopes: [],
  };

  const createMockExecutionContext = (
    request: Partial<AuthenticatedRequest> = {},
  ): { context: ExecutionContext; request: AuthenticatedRequest } => {
    const mockRequest = {
      headers: {},
      ...request,
    } as AuthenticatedRequest;

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };

    return { context, request: mockRequest };
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const mockTokenValidationService = {
      validateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceAuthGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TokenValidationService,
          useValue: mockTokenValidationService,
        },
      ],
    }).compile();

    guard = module.get<ServiceAuthGuard>(ServiceAuthGuard);
    configService = module.get(ConfigService);
    tokenValidationService = module.get(TokenValidationService);

    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    describe('when OAuth2 or service-to-service is disabled', () => {
      it('should return true when OAuth2 is disabled', async () => {
        const disabledConfig: OAuth2Config = { ...mockOAuth2Config, enabled: false };
        configService.get.mockReturnValue(disabledConfig);

        const { context } = createMockExecutionContext();
        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(configService.get).toHaveBeenCalledWith('oauth2');
        expect(tokenValidationService.validateToken).not.toHaveBeenCalled();
      });

      it('should return true when service-to-service is disabled', async () => {
        const disabledConfig: OAuth2Config = {
          ...mockOAuth2Config,
          serviceToServiceEnabled: false,
        };
        configService.get.mockReturnValue(disabledConfig);

        const { context } = createMockExecutionContext();
        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(tokenValidationService.validateToken).not.toHaveBeenCalled();
      });

      it('should return true when OAuth2 config is undefined', async () => {
        configService.get.mockReturnValue(undefined);

        const { context } = createMockExecutionContext();
        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should return true when OAuth2 config is null', async () => {
        configService.get.mockReturnValue(null);

        const { context } = createMockExecutionContext();
        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('when OAuth2 and service-to-service are enabled', () => {
      beforeEach(() => {
        configService.get.mockReturnValue(mockOAuth2Config);
      });

      describe('authorization header validation', () => {
        it('should throw UnauthorizedException when authorization header is missing', async () => {
          const { context } = createMockExecutionContext({
            headers: {},
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow(
            'Missing or invalid authorization header',
          );
        });

        it('should throw UnauthorizedException when authorization header is undefined', async () => {
          const { context } = createMockExecutionContext({
            headers: { authorization: undefined },
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow(
            'Missing or invalid authorization header',
          );
        });

        it('should throw UnauthorizedException when authorization header does not start with Bearer', async () => {
          const { context } = createMockExecutionContext({
            headers: { authorization: 'Basic token123' },
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow(
            'Missing or invalid authorization header',
          );
        });

        it('should throw UnauthorizedException when authorization header is just "Bearer"', async () => {
          const { context } = createMockExecutionContext({
            headers: { authorization: 'Bearer' },
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow(
            'Missing or invalid authorization header',
          );
        });

        it('should throw UnauthorizedException when authorization header is "Bearer "', async () => {
          const { context } = createMockExecutionContext({
            headers: { authorization: 'Bearer ' },
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow(
            'Missing or invalid authorization header',
          );
        });
      });

      describe('token validation', () => {
        it('should validate token and attach user to request for user with read and write scopes', async () => {
          tokenValidationService.validateToken.mockResolvedValue(mockUser);

          const { context, request: mockRequest } = createMockExecutionContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          const result = await guard.canActivate(context);

          expect(result).toBe(true);
          expect(tokenValidationService.validateToken).toHaveBeenCalledWith('valid-token');
          expect(mockRequest.user).toEqual(mockUser);
        });

        it('should validate token and attach user for user with read scope only', async () => {
          tokenValidationService.validateToken.mockResolvedValue(mockUserWithReadOnly);

          const { context, request: mockRequest } = createMockExecutionContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          const result = await guard.canActivate(context);

          expect(result).toBe(true);
          expect(tokenValidationService.validateToken).toHaveBeenCalledWith('valid-token');
          expect(mockRequest.user).toEqual(mockUserWithReadOnly);
        });

        it('should validate token and attach user for user with write scope only', async () => {
          tokenValidationService.validateToken.mockResolvedValue(mockUserWithWriteOnly);

          const { context, request: mockRequest } = createMockExecutionContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          const result = await guard.canActivate(context);

          expect(result).toBe(true);
          expect(tokenValidationService.validateToken).toHaveBeenCalledWith('valid-token');
          expect(mockRequest.user).toEqual(mockUserWithWriteOnly);
        });

        it('should throw UnauthorizedException when user has no read or write scopes', async () => {
          tokenValidationService.validateToken.mockResolvedValue(mockUserWithoutScopes);

          const { context } = createMockExecutionContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow(
            'Insufficient permissions for service access',
          );
          expect(tokenValidationService.validateToken).toHaveBeenCalledWith('valid-token');
        });

        it('should handle token with different scopes', async () => {
          const userWithOtherScopes: AuthenticatedUser = {
            ...mockUser,
            scopes: ['admin', 'user'],
          };
          tokenValidationService.validateToken.mockResolvedValue(userWithOtherScopes);

          const { context } = createMockExecutionContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow(
            'Insufficient permissions for service access',
          );
        });
      });

      describe('error handling', () => {
        it('should throw UnauthorizedException when token validation fails', async () => {
          tokenValidationService.validateToken.mockRejectedValue(new Error('Invalid token'));

          const { context } = createMockExecutionContext({
            headers: { authorization: 'Bearer invalid-token' },
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow('Service authentication failed');
          expect(tokenValidationService.validateToken).toHaveBeenCalledWith('invalid-token');
        });

        it('should throw UnauthorizedException when token validation throws UnauthorizedException', async () => {
          tokenValidationService.validateToken.mockRejectedValue(
            new UnauthorizedException('Token expired'),
          );

          const { context } = createMockExecutionContext({
            headers: { authorization: 'Bearer expired-token' },
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow('Service authentication failed');
        });

        it('should throw UnauthorizedException for any validation service error', async () => {
          tokenValidationService.validateToken.mockRejectedValue(new Error('Network error'));

          const { context } = createMockExecutionContext({
            headers: { authorization: 'Bearer network-error-token' },
          });

          await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
          await expect(guard.canActivate(context)).rejects.toThrow('Service authentication failed');
        });
      });

      describe('token extraction', () => {
        it('should correctly extract token from Bearer header', async () => {
          tokenValidationService.validateToken.mockResolvedValue(mockUser);

          const { context } = createMockExecutionContext({
            headers: { authorization: 'Bearer my-secret-token-12345' },
          });

          await guard.canActivate(context);

          expect(tokenValidationService.validateToken).toHaveBeenCalledWith(
            'my-secret-token-12345',
          );
        });

        it('should handle tokens with special characters', async () => {
          tokenValidationService.validateToken.mockResolvedValue(mockUser);

          const specialToken =
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImp0aSI6ImYyNzY2ZjEyLTc1ZGQtNDZmMS05ZjEyLTgxNjk4MTlmMDJmNyIsImlhdCI6MTU0NjQzMDc5OCwiZXhwIjoxNTQ2NDM0Mzk4fQ.iefepWBdNaP6E9f8F7qVKm5TT7hfqFXS8FmYHzNKWHs'; // pragma: allowlist secret
          const { context } = createMockExecutionContext({
            headers: { authorization: `Bearer ${specialToken}` },
          });

          await guard.canActivate(context);

          expect(tokenValidationService.validateToken).toHaveBeenCalledWith(specialToken);
        });
      });

      describe('request modification', () => {
        it('should attach user object to request', async () => {
          tokenValidationService.validateToken.mockResolvedValue(mockUser);

          const { context, request: mockRequest } = createMockExecutionContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          await guard.canActivate(context);

          expect(mockRequest.user).toEqual(mockUser);
        });
      });
    });
  });

  describe('integration scenarios', () => {
    it('should work with realistic OAuth2 configurations', async () => {
      const realisticConfig: OAuth2Config = {
        enabled: true,
        serviceToServiceEnabled: true,
        introspectionEnabled: true,
        clientId: 'meal-plan-service',
        clientSecret: 'super-secret-key', // pragma: allowlist secret
        introspectionCacheTTL: 600000,
      };
      configService.get.mockReturnValue(realisticConfig);
      tokenValidationService.validateToken.mockResolvedValue(mockUser);

      const { context } = createMockExecutionContext({
        headers: { authorization: 'Bearer production-token' },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('production-token');
    });
  });
});
