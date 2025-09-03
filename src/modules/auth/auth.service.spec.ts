import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenValidationService } from './services/token-validation.service';
import { OAuth2Config } from '../../config/configuration';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';

describe('AuthService', () => {
  let service: AuthService;
  let configService: jest.Mocked<ConfigService>;
  let tokenValidationService: jest.Mocked<TokenValidationService>;

  const mockOAuth2Config: OAuth2Config = {
    enabled: true,
    serviceToServiceEnabled: true,
    introspectionEnabled: false,
    clientId: 'test-client',
    clientSecret: 'test-secret',
    introspectionCacheTTL: 300000,
  };

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    sub: 'user-123',
    clientId: 'test-client',
    scopes: ['read', 'write'],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const mockTokenValidationService = {
      validateToken: jest.fn(),
      cleanupCache: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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

    service = module.get<AuthService>(AuthService);
    configService = module.get(ConfigService);
    tokenValidationService = module.get(TokenValidationService);

    // Mock logger to avoid console output during tests
    jest.spyOn(service['logger'], 'debug').mockImplementation();
    jest.spyOn(service['logger'], 'error').mockImplementation();

    jest.clearAllMocks();
  });

  describe('validateAccessToken', () => {
    it('should delegate token validation to TokenValidationService', async () => {
      tokenValidationService.validateToken.mockResolvedValue(mockUser);

      const result = await service.validateAccessToken('valid-token');

      expect(result).toEqual(mockUser);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('valid-token');
    });

    it('should propagate validation errors', async () => {
      const validationError = new Error('Token validation failed');
      tokenValidationService.validateToken.mockRejectedValue(validationError);

      await expect(service.validateAccessToken('invalid-token')).rejects.toThrow(validationError);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should handle different token formats', async () => {
      const jwtToken =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImp0aSI6ImYyNzY2ZjEyLTc1ZGQtNDZmMS05ZjEyLTgxNjk4MTlmMDJmNyIsImlhdCI6MTU0NjQzMDc5OCwiZXhwIjoxNTQ2NDM0Mzk4fQ.iefepWBdNaP6E9f8F7qVKm5TT7hfqFXS8FmYHzNKWHs';
      tokenValidationService.validateToken.mockResolvedValue(mockUser);

      const result = await service.validateAccessToken(jwtToken);

      expect(result).toEqual(mockUser);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith(jwtToken);
    });

    it('should handle empty token string', async () => {
      const validationError = new Error('Empty token');
      tokenValidationService.validateToken.mockRejectedValue(validationError);

      await expect(service.validateAccessToken('')).rejects.toThrow(validationError);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith('');
    });

    it('should handle token with special characters', async () => {
      const tokenWithSpecialChars = 'token-with-special-chars!@#$%^&*()';
      tokenValidationService.validateToken.mockResolvedValue(mockUser);

      const result = await service.validateAccessToken(tokenWithSpecialChars);

      expect(result).toEqual(mockUser);
      expect(tokenValidationService.validateToken).toHaveBeenCalledWith(tokenWithSpecialChars);
    });
  });

  describe('isOAuth2Enabled', () => {
    it('should return true when OAuth2 is enabled', () => {
      configService.get.mockReturnValue(mockOAuth2Config);

      const result = service.isOAuth2Enabled();

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('oauth2');
    });

    it('should return false when OAuth2 is disabled', () => {
      const disabledConfig = { ...mockOAuth2Config, enabled: false };
      configService.get.mockReturnValue(disabledConfig);

      const result = service.isOAuth2Enabled();

      expect(result).toBe(false);
    });

    it('should return false when OAuth2 config is undefined', () => {
      configService.get.mockReturnValue(undefined);

      const result = service.isOAuth2Enabled();

      expect(result).toBe(false);
    });

    it('should return false when OAuth2 config is null', () => {
      configService.get.mockReturnValue(null);

      const result = service.isOAuth2Enabled();

      expect(result).toBe(false);
    });

    it('should return false when OAuth2 config is missing enabled property', () => {
      const configWithoutEnabled = { ...mockOAuth2Config };
      delete (configWithoutEnabled as any).enabled;
      configService.get.mockReturnValue(configWithoutEnabled);

      const result = service.isOAuth2Enabled();

      expect(result).toBe(false);
    });

    it('should handle non-boolean enabled values', () => {
      const configWithStringEnabled = { ...mockOAuth2Config, enabled: 'true' as any };
      configService.get.mockReturnValue(configWithStringEnabled);

      const result = service.isOAuth2Enabled();

      expect(result).toBe(false); // Should be strict boolean comparison
    });

    it('should handle enabled set to null', () => {
      const configWithNullEnabled = { ...mockOAuth2Config, enabled: null as any };
      configService.get.mockReturnValue(configWithNullEnabled);

      const result = service.isOAuth2Enabled();

      expect(result).toBe(false);
    });
  });

  describe('isServiceToServiceEnabled', () => {
    it('should return true when service-to-service is enabled', () => {
      configService.get.mockReturnValue(mockOAuth2Config);

      const result = service.isServiceToServiceEnabled();

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('oauth2');
    });

    it('should return false when service-to-service is disabled', () => {
      const disabledConfig = { ...mockOAuth2Config, serviceToServiceEnabled: false };
      configService.get.mockReturnValue(disabledConfig);

      const result = service.isServiceToServiceEnabled();

      expect(result).toBe(false);
    });

    it('should return false when OAuth2 config is undefined', () => {
      configService.get.mockReturnValue(undefined);

      const result = service.isServiceToServiceEnabled();

      expect(result).toBe(false);
    });

    it('should return false when OAuth2 config is null', () => {
      configService.get.mockReturnValue(null);

      const result = service.isServiceToServiceEnabled();

      expect(result).toBe(false);
    });

    it('should return false when serviceToServiceEnabled property is missing', () => {
      const configWithoutServiceEnabled = { ...mockOAuth2Config };
      delete (configWithoutServiceEnabled as any).serviceToServiceEnabled;
      configService.get.mockReturnValue(configWithoutServiceEnabled);

      const result = service.isServiceToServiceEnabled();

      expect(result).toBe(false);
    });

    it('should handle non-boolean serviceToServiceEnabled values', () => {
      const configWithStringServiceEnabled = {
        ...mockOAuth2Config,
        serviceToServiceEnabled: 'true' as any,
      };
      configService.get.mockReturnValue(configWithStringServiceEnabled);

      const result = service.isServiceToServiceEnabled();

      expect(result).toBe(false); // Should be strict boolean comparison
    });

    it('should handle serviceToServiceEnabled set to null', () => {
      const configWithNullServiceEnabled = {
        ...mockOAuth2Config,
        serviceToServiceEnabled: null as any,
      };
      configService.get.mockReturnValue(configWithNullServiceEnabled);

      const result = service.isServiceToServiceEnabled();

      expect(result).toBe(false);
    });
  });

  describe('isIntrospectionEnabled', () => {
    it('should return true when introspection is enabled', () => {
      const introspectionConfig = { ...mockOAuth2Config, introspectionEnabled: true };
      configService.get.mockReturnValue(introspectionConfig);

      const result = service.isIntrospectionEnabled();

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('oauth2');
    });

    it('should return false when introspection is disabled', () => {
      configService.get.mockReturnValue(mockOAuth2Config); // introspectionEnabled: false

      const result = service.isIntrospectionEnabled();

      expect(result).toBe(false);
    });

    it('should return false when OAuth2 config is undefined', () => {
      configService.get.mockReturnValue(undefined);

      const result = service.isIntrospectionEnabled();

      expect(result).toBe(false);
    });

    it('should return false when OAuth2 config is null', () => {
      configService.get.mockReturnValue(null);

      const result = service.isIntrospectionEnabled();

      expect(result).toBe(false);
    });

    it('should return false when introspectionEnabled property is missing', () => {
      const configWithoutIntrospection = { ...mockOAuth2Config };
      delete (configWithoutIntrospection as any).introspectionEnabled;
      configService.get.mockReturnValue(configWithoutIntrospection);

      const result = service.isIntrospectionEnabled();

      expect(result).toBe(false);
    });

    it('should handle non-boolean introspectionEnabled values', () => {
      const configWithStringIntrospection = {
        ...mockOAuth2Config,
        introspectionEnabled: 'true' as any,
      };
      configService.get.mockReturnValue(configWithStringIntrospection);

      const result = service.isIntrospectionEnabled();

      expect(result).toBe(false); // Should be strict boolean comparison
    });

    it('should handle introspectionEnabled set to null', () => {
      const configWithNullIntrospection = {
        ...mockOAuth2Config,
        introspectionEnabled: null as any,
      };
      configService.get.mockReturnValue(configWithNullIntrospection);

      const result = service.isIntrospectionEnabled();

      expect(result).toBe(false);
    });
  });

  describe('cleanupTokenCache', () => {
    it('should delegate cache cleanup to TokenValidationService', () => {
      service.cleanupTokenCache();

      expect(tokenValidationService.cleanupCache).toHaveBeenCalled();
    });

    it('should not throw error when cleanup is called multiple times', () => {
      expect(() => {
        service.cleanupTokenCache();
        service.cleanupTokenCache();
        service.cleanupTokenCache();
      }).not.toThrow();

      expect(tokenValidationService.cleanupCache).toHaveBeenCalledTimes(3);
    });

    it('should handle cleanup service errors gracefully', () => {
      tokenValidationService.cleanupCache.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      expect(() => service.cleanupTokenCache()).toThrow('Cleanup failed');
    });
  });

  describe('integration scenarios', () => {
    it('should work with all features enabled', () => {
      const fullConfig: OAuth2Config = {
        enabled: true,
        serviceToServiceEnabled: true,
        introspectionEnabled: true,
        clientId: 'full-client',
        clientSecret: 'full-secret',
        introspectionCacheTTL: 600000,
      };
      configService.get.mockReturnValue(fullConfig);

      expect(service.isOAuth2Enabled()).toBe(true);
      expect(service.isServiceToServiceEnabled()).toBe(true);
      expect(service.isIntrospectionEnabled()).toBe(true);
    });

    it('should work with minimal configuration', () => {
      const minimalConfig: OAuth2Config = {
        enabled: true,
        serviceToServiceEnabled: false,
        introspectionEnabled: false,
        clientId: 'minimal-client',
        clientSecret: 'minimal-secret',
        introspectionCacheTTL: 300000,
      };
      configService.get.mockReturnValue(minimalConfig);

      expect(service.isOAuth2Enabled()).toBe(true);
      expect(service.isServiceToServiceEnabled()).toBe(false);
      expect(service.isIntrospectionEnabled()).toBe(false);
    });

    it('should work with everything disabled', () => {
      const disabledConfig: OAuth2Config = {
        enabled: false,
        serviceToServiceEnabled: false,
        introspectionEnabled: false,
        clientId: 'disabled-client',
        clientSecret: 'disabled-secret',
        introspectionCacheTTL: 300000,
      };
      configService.get.mockReturnValue(disabledConfig);

      expect(service.isOAuth2Enabled()).toBe(false);
      expect(service.isServiceToServiceEnabled()).toBe(false);
      expect(service.isIntrospectionEnabled()).toBe(false);
    });

    it('should handle mixed OAuth2 and service configurations', () => {
      const mixedConfig: OAuth2Config = {
        enabled: true,
        serviceToServiceEnabled: false,
        introspectionEnabled: true,
        clientId: 'mixed-client',
        clientSecret: 'mixed-secret',
        introspectionCacheTTL: 450000,
      };
      configService.get.mockReturnValue(mixedConfig);

      expect(service.isOAuth2Enabled()).toBe(true);
      expect(service.isServiceToServiceEnabled()).toBe(false);
      expect(service.isIntrospectionEnabled()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle config service throwing errors', () => {
      configService.get.mockImplementation(() => {
        throw new Error('Config service error');
      });

      expect(() => service.isOAuth2Enabled()).toThrow('Config service error');
      expect(() => service.isServiceToServiceEnabled()).toThrow('Config service error');
      expect(() => service.isIntrospectionEnabled()).toThrow('Config service error');
    });

    it('should handle config service returning unexpected values', () => {
      configService.get.mockReturnValue('invalid-config' as any);

      expect(service.isOAuth2Enabled()).toBe(false);
      expect(service.isServiceToServiceEnabled()).toBe(false);
      expect(service.isIntrospectionEnabled()).toBe(false);
    });

    it('should handle config service returning number', () => {
      configService.get.mockReturnValue(123 as any);

      expect(service.isOAuth2Enabled()).toBe(false);
      expect(service.isServiceToServiceEnabled()).toBe(false);
      expect(service.isIntrospectionEnabled()).toBe(false);
    });

    it('should handle config service returning empty object', () => {
      configService.get.mockReturnValue({});

      expect(service.isOAuth2Enabled()).toBe(false);
      expect(service.isServiceToServiceEnabled()).toBe(false);
      expect(service.isIntrospectionEnabled()).toBe(false);
    });
  });

  describe('caching behavior', () => {
    it('should not cache config results (calls config service each time)', () => {
      configService.get.mockReturnValue(mockOAuth2Config);

      // Call multiple times
      service.isOAuth2Enabled();
      service.isOAuth2Enabled();
      service.isServiceToServiceEnabled();
      service.isIntrospectionEnabled();

      // Should call config service for each check (no caching)
      expect(configService.get).toHaveBeenCalledTimes(4);
      expect(configService.get).toHaveBeenCalledWith('oauth2');
    });

    it('should allow configuration changes to take effect immediately', () => {
      // First call - OAuth2 enabled
      configService.get.mockReturnValueOnce(mockOAuth2Config);
      expect(service.isOAuth2Enabled()).toBe(true);

      // Configuration changes - OAuth2 disabled
      const disabledConfig = { ...mockOAuth2Config, enabled: false };
      configService.get.mockReturnValueOnce(disabledConfig);
      expect(service.isOAuth2Enabled()).toBe(false);

      expect(configService.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('logging', () => {
    it('should have logger initialized', () => {
      expect(service['logger']).toBeDefined();
      expect(service['logger']).toBeInstanceOf(Logger);
    });

    it('should handle logger errors gracefully', () => {
      // Logger errors should not affect service functionality
      jest.spyOn(service['logger'], 'debug').mockImplementation(() => {
        throw new Error('Logger error');
      });

      // Service methods should still work
      configService.get.mockReturnValue(mockOAuth2Config);
      expect(() => service.isOAuth2Enabled()).not.toThrow();
    });
  });
});
