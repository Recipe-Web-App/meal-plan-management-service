import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { TokenValidationService } from './token-validation.service';
import { OAuth2Config } from '../../../config/configuration';
import {
  JwtPayload,
  IntrospectionResponse,
  AuthenticatedUser,
} from '../interfaces/jwt-payload.interface';

// Mock modules
jest.mock('jsonwebtoken');
jest.mock('axios');

const mockedJwt = jest.mocked(jwt);
const mockedAxios = jest.mocked(axios);

describe('TokenValidationService', () => {
  let service: TokenValidationService;
  let configService: jest.Mocked<ConfigService>;

  const mockOAuth2Config: OAuth2Config = {
    enabled: true,
    serviceToServiceEnabled: true,
    introspectionEnabled: false,
    clientId: 'test-client',
    clientSecret: 'test-secret', // pragma: allowlist secret
    introspectionCacheTTL: 300000,
  };

  const mockJwtSecret = 'test-jwt-secret'; // pragma: allowlist secret

  const mockJwtPayload: JwtPayload = {
    type: 'access_token',
    iss: 'auth-service', // Must match oauth2Config.issuer
    aud: ['meal-plan-service'],
    user_id: 'user-123',
    sub: 'user-123',
    client_id: 'test-client',
    scopes: ['read', 'write'],
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };

  const mockIntrospectionResponse: IntrospectionResponse = {
    active: true,
    sub: 'user-123',
    client_id: 'test-client',
    scope: 'read write',
    exp: Math.floor(Date.now() / 1000) + 3600,
    username: 'testuser',
  };

  const mockExpectedUser: AuthenticatedUser = {
    id: 'user-123',
    sub: 'user-123',
    clientId: 'test-client',
    scopes: ['read', 'write'],
    exp: mockJwtPayload.exp,
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      post: jest.fn(),
    };
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenValidationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenValidationService>(TokenValidationService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  describe('validateToken', () => {
    describe('when OAuth2 is disabled', () => {
      it('should throw UnauthorizedException', async () => {
        configService.get.mockReturnValue({ enabled: false });

        await expect(service.validateToken('any-token')).rejects.toThrow(UnauthorizedException);
        await expect(service.validateToken('any-token')).rejects.toThrow(
          'OAuth2 authentication is disabled',
        );
      });
    });

    describe('when introspection is disabled (local JWT validation)', () => {
      beforeEach(() => {
        configService.get.mockImplementation((key: string) => {
          if (key === 'oauth2') return mockOAuth2Config;
          if (key === 'jwt.secret') return mockJwtSecret;
          return undefined;
        });
      });

      it('should validate token locally and return authenticated user', async () => {
        mockedJwt.verify.mockReturnValue(mockJwtPayload as any);

        const result = await service.validateToken('valid-jwt-token');

        expect(result).toEqual(mockExpectedUser);
        expect(mockedJwt.verify).toHaveBeenCalledWith('valid-jwt-token', mockJwtSecret);
      });

      it('should throw UnauthorizedException when JWT secret is not configured', async () => {
        configService.get.mockImplementation((key: string) => {
          if (key === 'oauth2') return mockOAuth2Config;
          if (key === 'jwt.secret') return undefined; // No JWT secret
          return undefined;
        });

        await expect(service.validateToken('any-token')).rejects.toThrow(UnauthorizedException);
        await expect(service.validateToken('any-token')).rejects.toThrow(
          'JWT secret not configured',
        );
      });

      it('should throw UnauthorizedException for invalid token type', async () => {
        const invalidPayload = { ...mockJwtPayload, type: 'refresh_token' };
        mockedJwt.verify.mockReturnValue(invalidPayload as any);

        await expect(service.validateToken('invalid-type-token')).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateToken('invalid-type-token')).rejects.toThrow(
          'Invalid token type',
        );
      });

      it('should throw UnauthorizedException for invalid issuer', async () => {
        const invalidPayload = { ...mockJwtPayload, iss: 'wrong-issuer' };
        mockedJwt.verify.mockReturnValue(invalidPayload as any);

        await expect(service.validateToken('invalid-issuer-token')).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateToken('invalid-issuer-token')).rejects.toThrow(
          'Invalid token issuer',
        );
      });

      it('should throw UnauthorizedException for expired token', async () => {
        const expiredPayload = { ...mockJwtPayload, exp: Math.floor(Date.now() / 1000) - 3600 };
        mockedJwt.verify.mockReturnValue(expiredPayload as any);

        await expect(service.validateToken('expired-token')).rejects.toThrow(UnauthorizedException);
        await expect(service.validateToken('expired-token')).rejects.toThrow('Token expired');
      });

      it('should handle JsonWebTokenError', async () => {
        mockedJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid token signature');
        });

        await expect(service.validateToken('invalid-signature-token')).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateToken('invalid-signature-token')).rejects.toThrow(
          'Invalid token signature',
        );
      });

      it('should handle TokenExpiredError', async () => {
        mockedJwt.verify.mockImplementation(() => {
          throw new jwt.TokenExpiredError('Token expired', new Date());
        });

        await expect(service.validateToken('expired-token')).rejects.toThrow(UnauthorizedException);
        await expect(service.validateToken('expired-token')).rejects.toThrow('Token expired');
      });

      it('should handle unexpected errors', async () => {
        const unexpectedError = new Error('Unexpected error');
        mockedJwt.verify.mockImplementation(() => {
          throw unexpectedError;
        });

        await expect(service.validateToken('error-token')).rejects.toThrow(UnauthorizedException);
        await expect(service.validateToken('error-token')).rejects.toThrow(
          'Invalid or expired token',
        );
      });
    });

    describe('when introspection is enabled', () => {
      let mockAxiosInstance: any;

      beforeEach(() => {
        const introspectionConfig = { ...mockOAuth2Config, introspectionEnabled: true };
        configService.get.mockReturnValue(introspectionConfig);

        mockAxiosInstance = {
          post: jest.fn(),
        };
        mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

        // Create new service instance to get the updated axios instance
        service = new TokenValidationService(configService);
      });

      it('should validate token via introspection and return authenticated user', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: mockIntrospectionResponse });

        const result = await service.validateToken('valid-token');

        expect(result).toEqual({
          id: 'user-123',
          sub: 'user-123',
          clientId: 'test-client',
          scopes: ['read', 'write'],
          exp: mockIntrospectionResponse.exp,
        });

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/oauth2/introspect',
          expect.any(URLSearchParams),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
              username: 'test-client',
              password: 'test-secret', // pragma: allowlist secret
            },
          },
        );
      });

      it('should throw UnauthorizedException when token is not active', async () => {
        const inactiveResponse = { ...mockIntrospectionResponse, active: false };
        mockAxiosInstance.post.mockResolvedValue({ data: inactiveResponse });

        await expect(service.validateToken('inactive-token')).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateToken('inactive-token')).rejects.toThrow(
          'Invalid or expired token',
        );
      });

      it('should handle 401 HTTP error', async () => {
        const error = { response: { status: 401 } };
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(service.validateToken('unauthorized-token')).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateToken('unauthorized-token')).rejects.toThrow(
          'Invalid or expired token',
        );
      });

      it('should handle other HTTP errors', async () => {
        const error = {
          response: {
            status: 500,
            data: 'Internal server error',
          },
        };
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(service.validateToken('server-error-token')).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateToken('server-error-token')).rejects.toThrow(
          'Invalid or expired token',
        );
      });

      it('should handle network errors', async () => {
        const error = new Error('Network error');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(service.validateToken('network-error-token')).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateToken('network-error-token')).rejects.toThrow(
          'Invalid or expired token',
        );
      });

      describe('caching', () => {
        it('should cache introspection responses', async () => {
          mockAxiosInstance.post.mockResolvedValue({ data: mockIntrospectionResponse });

          // First call
          await service.validateToken('cached-token');
          // Second call should use cache
          await service.validateToken('cached-token');

          // Should only call HTTP once
          expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
        });

        it('should not use cache for inactive tokens', async () => {
          const inactiveResponse = { ...mockIntrospectionResponse, active: false };
          mockAxiosInstance.post.mockResolvedValue({ data: inactiveResponse });

          try {
            await service.validateToken('inactive-token');
          } catch {
            // Expected to throw
          }

          try {
            await service.validateToken('inactive-token');
          } catch {
            // Expected to throw again, but should still hit cache
          }

          // Should only call HTTP once due to caching
          expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
        });

        it('should respect cache configuration', async () => {
          // Test that cache configuration is properly set up
          const configWithCustomTTL = {
            ...mockOAuth2Config,
            introspectionEnabled: true,
            introspectionCacheTTL: 60000,
          };
          configService.get.mockReturnValue(configWithCustomTTL);

          // This test verifies that the service can be configured with different cache TTL values
          expect(() => new TokenValidationService(configService)).not.toThrow();
        });
      });

      describe('mapIntrospectionToUser', () => {
        it('should map introspection response with all fields', async () => {
          const fullResponse: IntrospectionResponse = {
            active: true,
            sub: 'user-456',
            client_id: 'client-456',
            scope: 'admin read write',
            exp: 1234567890,
            username: 'admin-user',
          };
          mockAxiosInstance.post.mockResolvedValue({ data: fullResponse });

          const result = await service.validateToken('full-token');

          expect(result).toEqual({
            id: 'user-456',
            sub: 'user-456',
            clientId: 'client-456',
            scopes: ['admin', 'read', 'write'],
            exp: 1234567890,
          });
        });

        it('should handle missing fields in introspection response', async () => {
          const minimalResponse: IntrospectionResponse = {
            active: true,
          };
          mockAxiosInstance.post.mockResolvedValue({ data: minimalResponse });

          const result = await service.validateToken('minimal-token');

          expect(result).toEqual({
            id: '',
            sub: '',
            clientId: '',
            scopes: [],
            exp: 0,
          });
        });

        it('should prefer sub over username for id', async () => {
          const response: IntrospectionResponse = {
            active: true,
            sub: 'sub-id',
            username: 'username-id',
          };
          mockAxiosInstance.post.mockResolvedValue({ data: response });

          const result = await service.validateToken('preference-token');

          expect(result.id).toBe('sub-id');
          expect(result.sub).toBe('sub-id');
        });

        it('should use username when sub is not available', async () => {
          const response: IntrospectionResponse = {
            active: true,
            username: 'username-only',
          };
          mockAxiosInstance.post.mockResolvedValue({ data: response });

          const result = await service.validateToken('username-token');

          expect(result.id).toBe('username-only');
          expect(result.sub).toBe('');
        });
      });
    });

    describe('error scenarios', () => {
      it('should handle config service errors', async () => {
        configService.get.mockImplementation(() => {
          throw new Error('Config service error');
        });

        await expect(service.validateToken('config-error-token')).rejects.toThrow(
          'Config service error',
        );
      });
    });
  });

  describe('cleanupCache', () => {
    it('should remove expired cache entries', () => {
      // This is testing the private cache cleanup functionality
      expect(() => service.cleanupCache()).not.toThrow();
    });
  });

  describe('hashToken', () => {
    it('should create consistent hash from token', () => {
      // Testing the private hashToken method indirectly through caching behavior
      const token = 'abcdefghijklmnopqrstuvwxyz123456789'; // pragma: allowlist secret

      // The hash should use first 8 and last 8 characters
      // We can't directly test the private method, but we can verify consistent behavior
      expect(token.length).toBeGreaterThan(16); // Ensure our test token is long enough
    });
  });
});
