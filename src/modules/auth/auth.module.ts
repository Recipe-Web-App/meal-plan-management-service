import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { TokenValidationService } from './services/token-validation.service';
import { ServiceAuthService } from './services/service-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ServiceAuthGuard } from './guards/service-auth.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), ConfigModule],
  providers: [
    AuthService,
    TokenValidationService,
    ServiceAuthService,
    JwtStrategy,
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
