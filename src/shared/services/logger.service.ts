import { Injectable, LoggerService as NestLoggerService, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RequestContextService } from './request-context.service';

export interface LogContext {
  [key: string]: unknown;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  private formatMessage(message: string, context?: string): string {
    const requestContext = RequestContextService.getContext();
    const correlationId = requestContext?.correlationId;
    const userId = requestContext?.userId;

    let formattedMessage = message;

    if (context) {
      formattedMessage = `[${context}] ${formattedMessage}`;
    }

    if (correlationId) {
      formattedMessage = `[${correlationId}] ${formattedMessage}`;
    }

    if (userId) {
      formattedMessage = `[user:${userId}] ${formattedMessage}`;
    }

    return formattedMessage;
  }

  private enrichMeta(meta: LogContext = {}): LogContext {
    const requestContext = RequestContextService.getContext();

    const enrichedMeta: LogContext = { ...meta };

    if (requestContext?.correlationId) {
      enrichedMeta.correlationId = requestContext.correlationId;
    }

    if (requestContext?.userId) {
      enrichedMeta.userId = requestContext.userId;
    }

    if (requestContext?.ip) {
      enrichedMeta.ip = requestContext.ip;
    }

    return enrichedMeta;
  }

  log(message: string, context?: string): void {
    this.logger.info(this.formatMessage(message, context), this.enrichMeta({ context }));
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(this.formatMessage(message, context), this.enrichMeta({ context, trace }));
  }

  warn(message: string, meta?: LogContext, context?: string): void {
    if (typeof meta === 'string' && !context) {
      context = meta;
      meta = {};
    }
    this.logger.warn(this.formatMessage(message, context), this.enrichMeta({ context, ...meta }));
  }

  debug(message: string, meta?: LogContext, context?: string): void {
    if (typeof meta === 'string' && !context) {
      context = meta;
      meta = {};
    }
    this.logger.debug(this.formatMessage(message, context), this.enrichMeta({ context, ...meta }));
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(this.formatMessage(message, context), this.enrichMeta({ context }));
  }

  // Additional methods for structured logging
  info(message: string, meta?: LogContext, context?: string): void {
    this.logger.info(this.formatMessage(message, context), this.enrichMeta({ context, ...meta }));
  }

  // Method to get correlation ID from the request context
  getCorrelationId(): string | undefined {
    return RequestContextService.getCorrelationId();
  }

  logWithMeta(level: string, message: string, meta?: LogContext, context?: string): void {
    this.logger.log(
      level,
      this.formatMessage(message, context),
      this.enrichMeta({ context, ...meta }),
    );
  }

  // HTTP request logging
  logRequest(method: string, url: string, statusCode?: number, responseTime?: number): void {
    const meta = this.enrichMeta({
      method,
      url,
      statusCode,
      responseTime,
      type: 'http_request',
    });

    const message = `${method} ${url}${statusCode ? ` ${statusCode}` : ''}${responseTime ? ` ${responseTime}ms` : ''}`;
    this.logger.info(message, meta);
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration?: number,
    affectedRows?: number,
  ): void {
    const meta = this.enrichMeta({
      operation,
      table,
      duration,
      affectedRows,
      type: 'database_operation',
    });

    const message = `Database ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}${affectedRows !== undefined ? ` affected ${affectedRows} rows` : ''}`;
    this.logger.info(message, meta);
  }

  // External service call logging
  logExternalCall(
    service: string,
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
  ): void {
    const meta = this.enrichMeta({
      service,
      method,
      url,
      statusCode,
      duration,
      type: 'external_call',
    });

    const message = `External call to ${service}: ${method} ${url}${statusCode ? ` ${statusCode}` : ''}${duration ? ` ${duration}ms` : ''}`;
    this.logger.info(message, meta);
  }

  // Security event logging
  logSecurityEvent(event: string, details?: LogContext): void {
    const meta = this.enrichMeta({
      type: 'security_event',
      event,
      ...details,
    });

    this.logger.warn(`Security event: ${event}`, meta);
  }
}
