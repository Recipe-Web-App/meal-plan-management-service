import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { LoggerService } from './services/logger.service';
import { RequestContextService } from './services/request-context.service';

/**
 * SharedModule provides common services that are used across the entire application.
 *
 * This module is marked as @Global() so that its providers are available
 * throughout the application without needing to import this module in every
 * feature module that needs these services.
 *
 * Services provided:
 * - LoggerService: Structured logging with correlation ID support
 * - RequestContextService: Request context management for tracking
 * - PrismaService: Database connection and operations
 */
@Global()
@Module({
  providers: [LoggerService, RequestContextService, PrismaService],
  exports: [LoggerService, RequestContextService, PrismaService],
})
export class SharedModule {}
