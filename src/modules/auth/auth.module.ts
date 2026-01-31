import { Module, Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { TokenValidationService } from './services/token-validation.service';
import { ServiceAuthService } from './services/service-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ServiceAuthGuard } from './guards/service-auth.guard';
import { OAuth2Config } from '../../config/configuration';

const jwtStrategyProvider: Provider = {
  provide: JwtStrategy,
  useFactory: (
    configService: ConfigService,
    tokenValidationService: TokenValidationService,
  ): JwtStrategy | null => {
    const oauth2Config = configService.get<OAuth2Config>('oauth2');
    if (!oauth2Config?.enabled) {
      return null; // Skip when OAuth2 disabled (local dev)
    }
    return new JwtStrategy(configService, tokenValidationService);
  },
  inject: [ConfigService, TokenValidationService],
};

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), ConfigModule],
  providers: [
    AuthService,
    TokenValidationService,
    ServiceAuthService,
    jwtStrategyProvider,
    JwtAuthGuard,
    ServiceAuthGuard,
  ],
  exports: [
    AuthService,
    TokenValidationService,
    ServiceAuthService,
    JwtAuthGuard,
    ServiceAuthGuard,
    PassportModule,
  ],
})
export class AuthModule {}
