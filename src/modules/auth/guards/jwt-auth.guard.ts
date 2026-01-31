import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { OAuth2Config } from '../../../config/configuration';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const oauth2Config = this.configService.get<OAuth2Config>('oauth2');

    // If OAuth2 is disabled, allow all requests (for development/testing)
    if (!oauth2Config?.enabled) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: AuthenticatedUser | null,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const oauth2Config = this.configService.get<OAuth2Config>('oauth2');

    // If OAuth2 is disabled (local dev), use X-User-Id header or default mock user
    if (!oauth2Config?.enabled) {
      const request = context.switchToHttp().getRequest<Request>();
      const userId: string =
        (request.headers['x-user-id'] as string | undefined) ?? 'local-dev-user';

      return {
        id: userId,
        sub: userId,
        clientId: 'local-dev-client',
        scopes: ['read', 'write'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as TUser;
    }

    // If there was an error, throw it
    if (err) {
      throw err;
    }

    // If no user was returned, authentication failed
    if (!user) {
      throw new UnauthorizedException('Authentication failed');
    }

    return user as TUser;
  }
}
