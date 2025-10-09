import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ServiceAuthService } from './service-auth.service';
import { OAuth2Config } from '../../../config/configuration';

// Mock axios
jest.mock('axios');
const mockedAxios = jest.mocked(axios);

describe('ServiceAuthService', () => {
  let service: ServiceAuthService;
  let configService: jest.Mocked<ConfigService>;
  let mockAxiosInstance: any;

  const mockOAuth2Config: OAuth2Config = {
    enabled: true,
    serviceToServiceEnabled: true,
    introspectionEnabled: false,
    clientId: 'test-client',
    clientSecret: 'test-secret', // pragma: allowlist secret
    introspectionCacheTTL: 300000,
  };

  const mockTokenResponse = {
    access_token: 'mock-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'read write',
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    mockAxiosInstance = {
      post: jest.fn(),
    };
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceAuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ServiceAuthService>(ServiceAuthService);
    configService = module.get(ConfigService);

    // Mock logger to avoid console output during tests
    jest.spyOn(service['logger'], 'debug').mockImplementation();
    jest.spyOn(service['logger'], 'error').mockImplementation();

    jest.clearAllMocks();
  });

  describe('getServiceToken', () => {
    describe('when service-to-service authentication is disabled', () => {
      it('should throw error when OAuth2 is disabled', async () => {
        const disabledConfig = { ...mockOAuth2Config, enabled: false };
        configService.get.mockReturnValue(disabledConfig);

        await expect(service.getServiceToken()).rejects.toThrow(
          'Service-to-service authentication is disabled',
        );
        expect(mockAxiosInstance.post).not.toHaveBeenCalled();
      });

      it('should throw error when service-to-service is disabled', async () => {
        const disabledConfig = { ...mockOAuth2Config, serviceToServiceEnabled: false };
        configService.get.mockReturnValue(disabledConfig);

        await expect(service.getServiceToken()).rejects.toThrow(
          'Service-to-service authentication is disabled',
        );
        expect(mockAxiosInstance.post).not.toHaveBeenCalled();
      });

      it('should throw error when OAuth2 config is undefined', async () => {
        configService.get.mockReturnValue(undefined);

        await expect(service.getServiceToken()).rejects.toThrow(
          'Service-to-service authentication is disabled',
        );
      });

      it('should throw error when OAuth2 config is null', async () => {
        configService.get.mockReturnValue(null);

        await expect(service.getServiceToken()).rejects.toThrow(
          'Service-to-service authentication is disabled',
        );
      });
    });

    describe('when service-to-service authentication is enabled', () => {
      beforeEach(() => {
        configService.get.mockReturnValue(mockOAuth2Config);
      });

      it('should fetch and return a new token', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

        const token = await service.getServiceToken();

        expect(token).toBe('mock-access-token');
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/oauth2/token',
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

        const postCallArgs = mockAxiosInstance.post.mock.calls[0];
        const urlParams = postCallArgs[1] as URLSearchParams;
        expect(urlParams.get('grant_type')).toBe('client_credentials');
        expect(urlParams.get('scope')).toBe('read write');
      });

      it('should return cached token if still valid', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

        // First call - should fetch new token
        const token1 = await service.getServiceToken();

        // Second call - should return cached token
        const token2 = await service.getServiceToken();

        expect(token1).toBe('mock-access-token');
        expect(token2).toBe('mock-access-token');
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      });

      it('should fetch new token when cache is expired', async () => {
        // Mock a very short expiration time
        const shortExpiryResponse = { ...mockTokenResponse, expires_in: -1 };
        mockAxiosInstance.post
          .mockResolvedValueOnce({ data: shortExpiryResponse })
          .mockResolvedValueOnce({ data: { ...mockTokenResponse, access_token: 'new-token' } });

        // First call
        const token1 = await service.getServiceToken();

        // Wait a bit to ensure expiration
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Second call - should fetch new token
        const token2 = await service.getServiceToken();

        expect(token1).toBe('mock-access-token');
        expect(token2).toBe('new-token');
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      });

      it('should handle concurrent token requests', async () => {
        mockAxiosInstance.post.mockImplementation(
          () =>
            new Promise((resolve) => setTimeout(() => resolve({ data: mockTokenResponse }), 100)),
        );

        // Start multiple concurrent requests
        const promises = [
          service.getServiceToken(),
          service.getServiceToken(),
          service.getServiceToken(),
        ];

        const results = await Promise.all(promises);

        // All should return the same token
        expect(results).toEqual(['mock-access-token', 'mock-access-token', 'mock-access-token']);
        // But only one HTTP request should have been made
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      });

      describe('error handling', () => {
        it('should handle 401 authentication errors', async () => {
          const error = {
            response: {
              status: 401,
              data: { error: 'invalid_client' },
              statusText: 'Unauthorized',
            },
          };
          mockAxiosInstance.post.mockRejectedValue(error);

          await expect(service.getServiceToken()).rejects.toThrow(
            'Service authentication failed - invalid client credentials',
          );
        });

        it('should handle other HTTP errors with error message', async () => {
          const error = {
            response: {
              status: 500,
              data: { error: 'internal_server_error' },
              statusText: 'Internal Server Error',
            },
          };
          mockAxiosInstance.post.mockRejectedValue(error);

          await expect(service.getServiceToken()).rejects.toThrow(
            'Service token request failed with status 500: internal_server_error',
          );
        });

        it('should handle HTTP errors without error message', async () => {
          const error = {
            response: {
              status: 503,
              statusText: 'Service Unavailable',
            },
          };
          mockAxiosInstance.post.mockRejectedValue(error);

          await expect(service.getServiceToken()).rejects.toThrow(
            'Service token request failed with status 503: Service Unavailable',
          );
        });

        it('should handle network errors', async () => {
          const error = new Error('Network error');
          mockAxiosInstance.post.mockRejectedValue(error);

          await expect(service.getServiceToken()).rejects.toThrow(
            'Service token request failed: Network error',
          );
        });

        it('should handle unknown errors', async () => {
          const error = 'Unknown error';
          mockAxiosInstance.post.mockRejectedValue(error);

          await expect(service.getServiceToken()).rejects.toThrow(
            'Service token request failed: Unknown error',
          );
        });

        it('should clear token refresh promise after error', async () => {
          mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

          // First call should fail
          await expect(service.getServiceToken()).rejects.toThrow();

          // Second call should also make a new attempt (not reuse the failed promise)
          mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });
          const token = await service.getServiceToken();

          expect(token).toBe('mock-access-token');
          expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
        });
      });
    });
  });

  describe('getAuthorizationHeader', () => {
    beforeEach(() => {
      configService.get.mockReturnValue(mockOAuth2Config);
    });

    it('should return authorization header with Bearer token', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      const header = await service.getAuthorizationHeader();

      expect(header).toEqual({
        Authorization: 'Bearer mock-access-token',
      });
    });

    it('should use cached token for authorization header', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      // Get token first
      await service.getServiceToken();

      // Get authorization header
      const header = await service.getAuthorizationHeader();

      expect(header).toEqual({
        Authorization: 'Bearer mock-access-token',
      });
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearTokenCache', () => {
    beforeEach(() => {
      configService.get.mockReturnValue(mockOAuth2Config);
    });

    it('should clear cached token', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      // Get token first
      await service.getServiceToken();

      // Clear cache
      service.clearTokenCache();

      // Next call should fetch new token
      mockAxiosInstance.post.mockResolvedValue({
        data: { ...mockTokenResponse, access_token: 'new-token' },
      });
      const newToken = await service.getServiceToken();

      expect(newToken).toBe('new-token');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('isEnabled', () => {
    it('should return true when both OAuth2 and service-to-service are enabled', () => {
      configService.get.mockReturnValue(mockOAuth2Config);

      expect(service.isEnabled()).toBe(true);
    });

    it('should return false when OAuth2 is disabled', () => {
      const disabledConfig = { ...mockOAuth2Config, enabled: false };
      configService.get.mockReturnValue(disabledConfig);

      expect(service.isEnabled()).toBe(false);
    });

    it('should return false when service-to-service is disabled', () => {
      const disabledConfig = { ...mockOAuth2Config, serviceToServiceEnabled: false };
      configService.get.mockReturnValue(disabledConfig);

      expect(service.isEnabled()).toBe(false);
    });

    it('should return false when OAuth2 config is undefined', () => {
      configService.get.mockReturnValue(undefined);

      expect(service.isEnabled()).toBe(false);
    });

    it('should return false when OAuth2 config is null', () => {
      configService.get.mockReturnValue(null);

      expect(service.isEnabled()).toBe(false);
    });

    it('should handle config without enabled property', () => {
      const configWithoutEnabled = { ...mockOAuth2Config };
      delete (configWithoutEnabled as any).enabled;
      configService.get.mockReturnValue(configWithoutEnabled);

      expect(service.isEnabled()).toBe(false);
    });

    it('should handle config without serviceToServiceEnabled property', () => {
      const configWithoutServiceEnabled = { ...mockOAuth2Config };
      delete (configWithoutServiceEnabled as any).serviceToServiceEnabled;
      configService.get.mockReturnValue(configWithoutServiceEnabled);

      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('getTokenInfo', () => {
    beforeEach(() => {
      configService.get.mockReturnValue(mockOAuth2Config);
    });

    it('should return no token info when no token is cached', () => {
      const info = service.getTokenInfo();

      expect(info).toEqual({
        hasToken: false,
      });
    });

    it('should return token info when token is cached', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      await service.getServiceToken();
      const info = service.getTokenInfo();

      expect(info.hasToken).toBe(true);
      expect(info.expiresAt).toBeDefined();
      expect(info.expiresIn).toBeGreaterThan(0);
      expect(typeof info.expiresAt).toBe('string');
      expect(typeof info.expiresIn).toBe('number');
    });

    it('should return correct expiration info', async () => {
      const fixedTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(fixedTime);

      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      await service.getServiceToken();
      const info = service.getTokenInfo();

      // Should have approximately 3600 seconds remaining (minus buffer)
      expect(info.expiresIn).toBeLessThan(3600);
      expect(info.expiresIn).toBeGreaterThan(3500); // Account for 60-second buffer
    });

    it('should return 0 for expired tokens', async () => {
      // Mock expired token
      const expiredResponse = { ...mockTokenResponse, expires_in: -1 };
      mockAxiosInstance.post.mockResolvedValue({ data: expiredResponse });

      await service.getServiceToken();

      // Wait a bit to ensure expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const info = service.getTokenInfo();

      expect(info.hasToken).toBe(true);
      expect(info.expiresIn).toBe(0);
    });
  });

  describe('token buffer handling', () => {
    beforeEach(() => {
      configService.get.mockReturnValue(mockOAuth2Config);
    });

    it('should apply token refresh buffer', async () => {
      const mockTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(mockTime);

      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      await service.getServiceToken();
      const info = service.getTokenInfo();

      // Token should expire 30 seconds before the actual expiry (buffer)
      const expectedExpiryTime = mockTime + mockTokenResponse.expires_in * 1000 - 30000;
      expect(new Date(info.expiresAt!).getTime()).toBe(expectedExpiryTime);
    });
  });

  describe('logging', () => {
    beforeEach(() => {
      configService.get.mockReturnValue(mockOAuth2Config);
      // Restore logger mocks to verify logging calls
      jest.restoreAllMocks();
      jest.spyOn(service['logger'], 'debug').mockImplementation();
      jest.spyOn(service['logger'], 'error').mockImplementation();
    });

    it('should log token acquisition', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      await service.getServiceToken();

      expect(service['logger'].debug).toHaveBeenCalledWith(
        'Fetching new service token using client credentials flow',
      );
      expect(service['logger'].debug).toHaveBeenCalledWith(
        expect.stringContaining('Service token obtained, expires at'),
      );
    });

    it('should log cache clearing', () => {
      service.clearTokenCache();

      expect(service['logger'].debug).toHaveBeenCalledWith('Clearing service token cache');
    });

    it('should log errors', async () => {
      const error = new Error('Test error');
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(service.getServiceToken()).rejects.toThrow();

      expect(service['logger'].error).toHaveBeenCalledWith(
        'Failed to obtain service token: Test error',
        expect.stringContaining('Error: Test error'),
      );
    });
  });
});
