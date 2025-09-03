import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenValidationService } from './services/token-validation.service';
import { OAuth2Config } from '../../config/configuration';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenValidationService: TokenValidationService,
  ) {}

  async validateAccessToken(token: string): Promise<AuthenticatedUser> {
    return await this.tokenValidationService.validateToken(token);
  }

  isOAuth2Enabled(): boolean {
    const oauth2Config = this.configService.get<OAuth2Config>('oauth2');
    return oauth2Config?.enabled === true;
  }

  isServiceToServiceEnabled(): boolean {
    const oauth2Config = this.configService.get<OAuth2Config>('oauth2');
    return oauth2Config?.serviceToServiceEnabled === true;
  }

  isIntrospectionEnabled(): boolean {
    const oauth2Config = this.configService.get<OAuth2Config>('oauth2');
    return oauth2Config?.introspectionEnabled === true;
  }

  // Cleanup method that can be called periodically
  cleanupTokenCache(): void {
    this.tokenValidationService.cleanupCache();
  }
}
