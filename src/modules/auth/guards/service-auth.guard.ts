import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenValidationService } from '../services/token-validation.service';
import { OAuth2Config } from '../../../config/configuration';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenValidationService: TokenValidationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const oauth2Config = this.configService.get<OAuth2Config>('oauth2');

    // If OAuth2 or service-to-service auth is disabled, allow all requests
    if (!oauth2Config?.enabled || !oauth2Config.serviceToServiceEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token || token.trim() === '') {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    let user: AuthenticatedUser;
    try {
      user = await this.tokenValidationService.validateToken(token);
    } catch {
      // Token validation errors should be generic
      throw new UnauthorizedException('Service authentication failed');
    }

    // For service-to-service calls, we expect specific client credentials
    // You might want to check for specific scopes or client IDs here
    if (!user.scopes.includes('read') && !user.scopes.includes('write')) {
      throw new UnauthorizedException('Insufficient permissions for service access');
    }

    // Attach user to request for use in controllers
    request.user = user;
    return true;
  }
}
