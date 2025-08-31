import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { SharedModule } from '@/shared';

@Module({
  imports: [TerminusModule, SharedModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
