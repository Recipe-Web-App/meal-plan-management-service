import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { OAuth2Config } from '../../../config/configuration';
import { oauth2Config } from '../../../config/oauth2.config';

interface ServiceToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

@Injectable()
export class ServiceAuthService {
  private readonly logger = new Logger(ServiceAuthService.name);
  private readonly httpClient: AxiosInstance;
  private cachedToken: CachedToken | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.httpClient = axios.create({
      baseURL: oauth2Config.authBaseUrl,
      timeout: 5000,
    });
  }

  /**
   * Get a valid service-to-service access token
   * Handles caching and automatic refresh
   */
  async getServiceToken(): Promise<string> {
    const oauth2EnvConfig = this.configService.get<OAuth2Config>('oauth2');

    if (!oauth2EnvConfig?.enabled || !oauth2EnvConfig.serviceToServiceEnabled) {
      throw new Error('Service-to-service authentication is disabled');
    }

    // Check if we have a valid cached token
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.token;
    }

    // Prevent multiple concurrent token refresh requests
    if (this.tokenRefreshPromise) {
      return await this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.fetchNewServiceToken(oauth2EnvConfig);

    try {
      const token = await this.tokenRefreshPromise;
      return token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async fetchNewServiceToken(oauth2EnvConfig: OAuth2Config): Promise<string> {
    try {
      this.logger.debug('Fetching new service token using client credentials flow');

      const response = await this.httpClient.post<ServiceToken>(
        oauth2Config.endpoints.token,
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: oauth2Config.scopes.join(' '),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: oauth2EnvConfig.clientId,
            password: oauth2EnvConfig.clientSecret,
          },
        },
      );

      const tokenData = response.data;
      const expiresAt = Date.now() + tokenData.expires_in * 1000 - oauth2Config.tokenRefreshBuffer;

      this.cachedToken = {
        token: tokenData.access_token,
        expiresAt,
      };

      this.logger.debug(`Service token obtained, expires at ${new Date(expiresAt).toISOString()}`);

      return tokenData.access_token;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to obtain service token: ${errorMessage}`, errorStack);

      const axiosError = error as {
        response?: { status?: number; data?: { error?: string }; statusText?: string };
      };
      if (axiosError.response?.status === 401) {
        throw new Error('Service authentication failed - invalid client credentials');
      }
      if (axiosError.response?.status) {
        throw new Error(
          `Service token request failed with status ${axiosError.response.status}: ${axiosError.response.data?.error ?? axiosError.response.statusText}`,
        );
      }

      throw new Error(`Service token request failed: ${errorMessage}`);
    }
  }

  private isTokenValid(cachedToken: CachedToken): boolean {
    return cachedToken.expiresAt > Date.now();
  }

  /**
   * Create an authorization header for service-to-service calls
   */
  async getAuthorizationHeader(): Promise<{ Authorization: string }> {
    const token = await this.getServiceToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Clear the cached token (useful for testing or when authentication fails)
   */
  clearTokenCache(): void {
    this.logger.debug('Clearing service token cache');
    this.cachedToken = null;
  }

  /**
   * Check if service-to-service authentication is enabled
   */
  isEnabled(): boolean {
    const oauth2EnvConfig = this.configService.get<OAuth2Config>('oauth2');
    return oauth2EnvConfig?.enabled === true && oauth2EnvConfig?.serviceToServiceEnabled === true;
  }

  /**
   * Get token info (for debugging/monitoring)
   */
  getTokenInfo(): { hasToken: boolean; expiresAt?: string; expiresIn?: number } {
    if (!this.cachedToken) {
      return { hasToken: false };
    }

    const expiresIn = Math.max(0, Math.floor((this.cachedToken.expiresAt - Date.now()) / 1000));

    return {
      hasToken: true,
      expiresAt: new Date(this.cachedToken.expiresAt).toISOString(),
      expiresIn,
    };
  }
}
