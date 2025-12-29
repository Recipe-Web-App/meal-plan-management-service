import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { JwtStrategy } from './jwt.strategy';
import { TokenValidationService } from '../services/token-validation.service';
import { OAuth2Config } from '../../../config/configuration';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: { get: Mock<(...args: unknown[]) => unknown> };
  let tokenValidationService: { validateToken: Mock<(...args: unknown[]) => unknown> };

  const mockOAuth2Config: OAuth2Config = {
    enabled: true,
    serviceToServiceEnabled: true,
    introspectionEnabled: false,
    clientId: 'test-client',
    clientSecret: 'test-secret', // pragma: allowlist secret
    introspectionCacheTTL: 300000,
  };

  const mockJwtSecret = 'test-jwt-secret'; // pragma: allowlist secret

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    sub: 'user-123',
    clientId: 'test-client',
    scopes: ['read', 'write'],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const createMockRequest = (authHeader?: string): Request =>
    ({
      headers: {
        authorization: authHeader,
      },
    }) as Request;

  beforeEach(async () => {
    const mockConfigService = {
      get: mock(() => {}),
    };

    const mockTokenValidationService = {
      validateToken: mock(() => {}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
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

    configService = module.get(ConfigService) as typeof configService;
    tokenValidationService = module.get(TokenValidationService) as typeof tokenValidationService;

    configService.get.mockClear();
    tokenValidationService.validateToken.mockClear();
  });

  describe('constructor', () => {
    it('should initialize successfully with valid configuration', () => {
      configService.get
        .mockReturnValueOnce(mockOAuth2Config) // OAuth2 config
        .mockReturnValueOnce(mockJwtSecret); // JWT secret

      expect(() => {
        strategy = new JwtStrategy(
          configService as unknown as ConfigService,
          tokenValidationService as unknown as TokenValidationService,
        );
      }).not.toThrow();

      expect(configService.get).toHaveBeenCalledWith('oauth2');
      expect(configService.get).toHaveBeenCalledWith('jwt.secret');
    });

    it('should throw error when OAuth2 is not enabled', () => {
      const disabledConfig = { ...mockOAuth2Config, enabled: false };
      configService.get.mockReturnValueOnce(disabledConfig);

      expect(() => {
        strategy = new JwtStrategy(
          configService as unknown as ConfigService,
          tokenValidationService as unknown as TokenValidationService,
        );
      }).toThrow('OAuth2 configuration is required when JWT strategy is enabled');
    });

    it('should throw error when OAuth2 config is undefined', () => {
      configService.get.mockReturnValueOnce(undefined);

      expect(() => {
        strategy = new JwtStrategy(
          configService as unknown as ConfigService,
          tokenValidationService as unknown as TokenValidationService,
        );
      }).toThrow('OAuth2 configuration is required when JWT strategy is enabled');
    });

    it('should throw error when OAuth2 config is null', () => {
      configService.get.mockReturnValueOnce(null);

      expect(() => {
        strategy = new JwtStrategy(
          configService as unknown as ConfigService,
          tokenValidationService as unknown as TokenValidationService,
        );
      }).toThrow('OAuth2 configuration is required when JWT strategy is enabled');
    });

    it('should throw error when JWT secret is not configured', () => {
      configService.get.mockReturnValueOnce(mockOAuth2Config).mockReturnValueOnce(undefined); // No JWT secret

      expect(() => {
        strategy = new JwtStrategy(
          configService as unknown as ConfigService,
          tokenValidationService as unknown as TokenValidationService,
        );
      }).toThrow('JWT secret is required for JWT strategy');
    });

    it('should throw error when JWT secret is null', () => {
      configService.get.mockReturnValueOnce(mockOAuth2Config).mockReturnValueOnce(null); // Null JWT secret

      expect(() => {
        strategy = new JwtStrategy(
          configService as unknown as ConfigService,
          tokenValidationService as unknown as TokenValidationService,
        );
      }).toThrow('JWT secret is required for JWT strategy');
    });

    it('should throw error when JWT secret is empty string', () => {
      configService.get.mockReturnValueOnce(mockOAuth2Config).mockReturnValueOnce(''); // Empty JWT secret

      expect(() => {
        strategy = new JwtStrategy(
          configService as unknown as ConfigService,
          tokenValidationService as unknown as TokenValidationService,
        );
      }).toThrow('JWT secret is required for JWT strategy');
    });

    it('should handle OAuth2 config without enabled property', () => {
      const configWithoutEnabled = { ...mockOAuth2Config };
      delete (configWithoutEnabled as any).enabled;
      configService.get.mockReturnValueOnce(configWithoutEnabled);

      expect(() => {
        strategy = new JwtStrategy(
          configService as unknown as ConfigService,
          tokenValidationService as unknown as TokenValidationService,
        );
      }).toThrow('OAuth2 configuration is required when JWT strategy is enabled');
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      configService.get.mockReturnValueOnce(mockOAuth2Config).mockReturnValueOnce(mockJwtSecret);
      strategy = new JwtStrategy(
        configService as unknown as ConfigService,
        tokenValidationService as unknown as TokenValidationService,
      );
    });

    it('should validate token and return authenticated user', async () => {
      const mockRequest = createMockRequest('Bearer valid-token');
      tokenValidationService.validateToken.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, {});

      expect(result).toEqual(mockUser);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException when no token is provided in request', async () => {
      const mockRequest = createMockRequest(); // No authorization header

      await expect(strategy.validate(mockRequest, {})).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockRequest, {})).rejects.toThrow('No token provided');
      expect(tokenValidationService.validateToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when authorization header is empty', async () => {
      const mockRequest = createMockRequest(''); // Empty authorization header

      await expect(strategy.validate(mockRequest, {})).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockRequest, {})).rejects.toThrow('No token provided');
      expect(tokenValidationService.validateToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when authorization header does not contain Bearer token', async () => {
      const mockRequest = createMockRequest('Basic some-basic-auth'); // Not Bearer token

      await expect(strategy.validate(mockRequest, {})).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockRequest, {})).rejects.toThrow('No token provided');
      expect(tokenValidationService.validateToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when Bearer token is empty', async () => {
      const mockRequest = createMockRequest('Bearer '); // Bearer with no token

      await expect(strategy.validate(mockRequest, {})).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockRequest, {})).rejects.toThrow('No token provided');
      expect(tokenValidationService.validateToken).not.toHaveBeenCalled();
    });

    it('should handle token validation service errors', async () => {
      const mockRequest = createMockRequest('Bearer invalid-token');
      const validationError = new UnauthorizedException('Invalid token');
      tokenValidationService.validateToken.mockRejectedValue(validationError);

      await expect(strategy.validate(mockRequest, {})).rejects.toThrow(validationError);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should handle generic token validation errors', async () => {
      const mockRequest = createMockRequest('Bearer error-token');
      const genericError = new Error('Token validation failed');
      tokenValidationService.validateToken.mockRejectedValue(genericError);

      await expect(strategy.validate(mockRequest, {})).rejects.toThrow(genericError);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('error-token');
    });

    it('should extract and validate different token formats', async () => {
      const jwtToken =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImp0aSI6ImYyNzY2ZjEyLTc1ZGQtNDZmMS05ZjEyLTgxNjk4MTlmMDJmNyIsImlhdCI6MTU0NjQzMDc5OCwiZXhwIjoxNTQ2NDM0Mzk4fQ.iefepWBdNaP6E9f8F7qVKm5TT7hfqFXS8FmYHzNKWHs'; // pragma: allowlist secret
      const mockRequest = createMockRequest(`Bearer ${jwtToken}`);
      tokenValidationService.validateToken.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, {});

      expect(result).toEqual(mockUser);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith(jwtToken);
    });

    it('should handle tokens with extra whitespace', async () => {
      const mockRequest = createMockRequest('  Bearer   token-with-spaces  ');
      tokenValidationService.validateToken.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, {});

      expect(result).toEqual(mockUser);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('token-with-spaces');
    });

    it('should handle case-insensitive Bearer prefix', async () => {
      // passport-jwt's ExtractJwt.fromAuthHeaderAsBearerToken() is actually case-insensitive
      const mockRequest = createMockRequest('bearer lowercase-bearer'); // lowercase bearer
      tokenValidationService.validateToken.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, {});

      expect(result).toEqual(mockUser);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('lowercase-bearer');
    });

    it('should handle mixed case Bearer prefix', async () => {
      // passport-jwt's ExtractJwt.fromAuthHeaderAsBearerToken() is actually case-insensitive
      const mockRequest = createMockRequest('bEaReR mixed-case-bearer');
      tokenValidationService.validateToken.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, {});

      expect(result).toEqual(mockUser);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('mixed-case-bearer');
    });

    describe('payload parameter handling', () => {
      it('should ignore JWT payload parameter when using custom validation', async () => {
        const mockRequest = createMockRequest('Bearer custom-token');
        const mockPayload = { sub: 'ignored', iat: 123, exp: 456 };
        tokenValidationService.validateToken.mockResolvedValue(mockUser);

        const result = await strategy.validate(mockRequest, mockPayload);

        expect(result).toEqual(mockUser);
        // Should use token from request, not payload
        expect(tokenValidationService.validateToken).toHaveBeenCalledWith('custom-token');
      });

      it('should work with null payload', async () => {
        const mockRequest = createMockRequest('Bearer null-payload-token');
        tokenValidationService.validateToken.mockResolvedValue(mockUser);

        const result = await strategy.validate(mockRequest, null);

        expect(result).toEqual(mockUser);
        expect(tokenValidationService.validateToken).toHaveBeenCalledWith('null-payload-token');
      });

      it('should work with undefined payload', async () => {
        const mockRequest = createMockRequest('Bearer undefined-payload-token');
        tokenValidationService.validateToken.mockResolvedValue(mockUser);

        const result = await strategy.validate(mockRequest, undefined);

        expect(result).toEqual(mockUser);
        expect(tokenValidationService.validateToken).toHaveBeenCalledWith(
          'undefined-payload-token',
        );
      });
    });

    describe('integration with ExtractJwt', () => {
      it('should use ExtractJwt.fromAuthHeaderAsBearerToken correctly', async () => {
        // Test that ExtractJwt is working as expected
        const mockRequest = createMockRequest('Bearer integration-test-token');

        // Verify ExtractJwt can extract the token
        const extractor = ExtractJwt.fromAuthHeaderAsBearerToken();
        const extractedToken = extractor(mockRequest);

        expect(extractedToken).toBe('integration-test-token');

        // Now test our strategy
        tokenValidationService.validateToken.mockResolvedValue(mockUser);
        const result = await strategy.validate(mockRequest, {});

        expect(result).toEqual(mockUser);
        expect(tokenValidationService.validateToken).toHaveBeenCalledWith('integration-test-token');
      });

      it('should handle ExtractJwt returning null', async () => {
        const mockRequest = createMockRequest('Not-Bearer invalid-format');

        await expect(strategy.validate(mockRequest, {})).rejects.toThrow(UnauthorizedException);
        await expect(strategy.validate(mockRequest, {})).rejects.toThrow('No token provided');
      });
    });

    describe('error propagation', () => {
      it('should propagate UnauthorizedException from token validation service', async () => {
        const mockRequest = createMockRequest('Bearer unauthorized-token');
        const unauthorizedError = new UnauthorizedException('Token expired');
        tokenValidationService.validateToken.mockRejectedValue(unauthorizedError);

        await expect(strategy.validate(mockRequest, {})).rejects.toThrow(UnauthorizedException);
        await expect(strategy.validate(mockRequest, {})).rejects.toThrow('Token expired');
      });

      it('should propagate custom errors from token validation service', async () => {
        const mockRequest = createMockRequest('Bearer custom-error-token');
        const customError = new Error('Custom validation error');
        tokenValidationService.validateToken.mockRejectedValue(customError);

        await expect(strategy.validate(mockRequest, {})).rejects.toThrow('Custom validation error');
      });
    });

    describe('realistic scenarios', () => {
      it('should handle production-like JWT tokens', async () => {
        const productionLikeToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImNsaWVudF9pZCI6Im1lYWwtcGxhbi1zZXJ2aWNlIiwic2NvcGVzIjpbInJlYWQiLCJ3cml0ZSJdLCJleHAiOjE2NDA5OTUyMDAsImlhdCI6MTY0MDk5MTYwMH0.signature'; // pragma: allowlist secret
        const mockRequest = createMockRequest(`Bearer ${productionLikeToken}`);
        tokenValidationService.validateToken.mockResolvedValue(mockUser);

        const result = await strategy.validate(mockRequest, {});

        expect(result).toEqual(mockUser);
        expect(tokenValidationService.validateToken).toHaveBeenCalledWith(productionLikeToken);
      });

      it('should handle requests with additional headers', async () => {
        const mockRequest = {
          headers: {
            authorization: 'Bearer additional-headers-token',
            'content-type': 'application/json',
            'x-request-id': 'req-123',
            'user-agent': 'Test Agent',
          },
        } as unknown as Request;

        tokenValidationService.validateToken.mockResolvedValue(mockUser);

        const result = await strategy.validate(mockRequest, {});

        expect(result).toEqual(mockUser);
        expect(tokenValidationService.validateToken).toHaveBeenCalledWith(
          'additional-headers-token',
        );
      });
    });
  });
});
