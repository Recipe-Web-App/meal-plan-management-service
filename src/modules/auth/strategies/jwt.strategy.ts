import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenValidationService } from '../services/token-validation.service';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { OAuth2Config } from '../../../config/configuration';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenValidationService: TokenValidationService,
  ) {
    const oauth2Config = configService.get<OAuth2Config>('oauth2');

    if (!oauth2Config?.enabled) {
      throw new Error('OAuth2 configuration is required when JWT strategy is enabled');
    }

    const jwtSecret = configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      throw new Error('JWT secret is required for JWT strategy');
    }

    const options: StrategyOptions & { passReqToCallback: true } = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true, // We'll handle validation ourselves
    };
    super(options);
  }

  async validate(req: Request, _payload: unknown): Promise<AuthenticatedUser> {
    // Extract the raw token from the request
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Use our custom token validation service
    return await this.tokenValidationService.validateToken(token);
  }
}
