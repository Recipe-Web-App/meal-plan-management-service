import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '@/config/database.config';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [HealthService, PrismaService],
})
export class HealthModule {}
