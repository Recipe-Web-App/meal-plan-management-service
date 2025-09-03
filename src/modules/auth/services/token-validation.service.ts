import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios, { AxiosInstance } from 'axios';
import { OAuth2Config } from '../../../config/configuration';
import { oauth2Config } from '../../../config/oauth2.config';
import {
  JwtPayload,
  IntrospectionResponse,
  AuthenticatedUser,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenValidationService {
  private readonly logger = new Logger(TokenValidationService.name);
  private readonly httpClient: AxiosInstance;
  private readonly introspectionCache = new Map<
    string,
    { data: IntrospectionResponse; expires: number }
  >();

  constructor(private readonly configService: ConfigService) {
    this.httpClient = axios.create({
      baseURL: oauth2Config.authBaseUrl,
      timeout: 5000,
    });
  }

  async validateToken(token: string): Promise<AuthenticatedUser> {
    const oauth2Config = this.configService.get<OAuth2Config>('oauth2');

    if (!oauth2Config?.enabled) {
      throw new UnauthorizedException('OAuth2 authentication is disabled');
    }

    try {
      if (oauth2Config.introspectionEnabled) {
        return await this.validateTokenViaIntrospection(token, oauth2Config);
      } else {
        return this.validateTokenLocally(token);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token validation failed: ${errorMessage}`);

      // Re-throw UnauthorizedException as-is to preserve specific error messages
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For other errors, throw generic message
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private validateTokenLocally(token: string): AuthenticatedUser {
    const jwtSecret = this.configService.get<string>('jwt.secret');

    if (!jwtSecret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      // Validate token structure according to OAuth2 service spec
      if (decoded.type !== 'access_token') {
        throw new UnauthorizedException('Invalid token type');
      }

      if (decoded.iss !== oauth2Config.issuer) {
        throw new UnauthorizedException('Invalid token issuer');
      }

      // Check if token is expired (JWT library handles this, but we can add buffer)
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp <= now) {
        throw new UnauthorizedException('Token expired');
      }

      return {
        id: decoded.user_id,
        sub: decoded.sub,
        clientId: decoded.client_id,
        scopes: decoded.scopes,
        exp: decoded.exp,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token signature');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      throw error;
    }
  }

  private async validateTokenViaIntrospection(
    token: string,
    oauth2EnvConfig: OAuth2Config,
  ): Promise<AuthenticatedUser> {
    // Check cache first
    const cacheKey = this.hashToken(token);
    const cached = this.introspectionCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      if (!cached.data.active) {
        throw new Error('Token is not active');
      }
      return this.mapIntrospectionToUser(cached.data);
    }

    try {
      const response = await this.httpClient.post(
        oauth2Config.endpoints.introspect,
        new URLSearchParams({
          token,
          token_type_hint: 'access_token',
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

      const introspectionData = response.data as IntrospectionResponse;

      // Cache the result
      this.introspectionCache.set(cacheKey, {
        data: introspectionData,
        expires: Date.now() + oauth2Config.introspectionCacheTTL,
      });

      if (!introspectionData.active) {
        throw new Error('Token is not active');
      }

      return this.mapIntrospectionToUser(introspectionData);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      if (axiosError.response?.status === 401) {
        throw new Error('Invalid token');
      }
      if (axiosError.response?.status) {
        this.logger.error(
          `Introspection failed with status ${axiosError.response.status}: ${String(axiosError.response.data)}`,
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Introspection request failed: ${errorMessage}`);
      }
      throw new Error('Token validation failed');
    }
  }

  private mapIntrospectionToUser(data: IntrospectionResponse): AuthenticatedUser {
    return {
      id: data.sub ?? data.username ?? '',
      sub: data.sub ?? '',
      clientId: data.client_id ?? '',
      scopes: data.scope ? data.scope.split(' ') : [],
      exp: data.exp ?? 0,
    };
  }

  private hashToken(token: string): string {
    // Use first and last 8 characters for cache key (don't store full token)
    return token.substring(0, 8) + token.substring(token.length - 8);
  }

  // Clean up expired cache entries periodically
  public cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.introspectionCache.entries()) {
      if (value.expires <= now) {
        this.introspectionCache.delete(key);
      }
    }
  }
}
