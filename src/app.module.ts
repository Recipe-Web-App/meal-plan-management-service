import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import configuration from '@/config/configuration';
import { validationSchema } from '@/config/env.validation';
import { createWinstonLogger } from '@/config/logger.config';
import { HealthModule } from '@/modules/health/health.module';
import { MealPlansModule } from '@/modules/meal-plans/meal-plans.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { MetricsModule } from '@/modules/metrics/metrics.module';
import { SharedModule } from '@/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: 3,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 20,
        },
        {
          name: 'long',
          ttl: configService.get<number>('rateLimit.ttl') ?? 60000,
          limit: configService.get<number>('rateLimit.limit') ?? 100,
        },
      ],
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => createWinstonLogger(configService),
    }),
    SharedModule,
    AuthModule,
    HealthModule,
    MealPlansModule,
    MetricsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
