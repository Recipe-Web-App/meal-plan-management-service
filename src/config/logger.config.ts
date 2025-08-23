import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import Transport from 'winston-transport';
import { RequestContextService } from '@/shared/services/request-context.service';
import type { LoggingConfig } from './configuration';

type LogInfo = winston.Logform.TransformableInfo &
  Record<string, unknown> & {
    timestamp?: string | number;
    level?: string;
    message?: string;
    context?: string;
    correlationId?: string;
    userId?: string;
    trace?: string;
    ip?: string;
  };

const createPrettyFormat = (): winston.Logform.Format =>
  winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    // use winston's expected type then cast to LogInfo for extras
    winston.format.printf((info: winston.Logform.TransformableInfo): string => {
      const i = info as LogInfo;
      const timestamp = String(i.timestamp ?? '');
      const level = String(i.level ?? '');
      const message = String(i.message ?? '');
      const context = i.context;
      const correlationId = i.correlationId;
      const userId = i.userId;

      const meta = { ...i } as Record<string, unknown>;
      delete meta.timestamp;
      delete meta.level;
      delete meta.message;
      delete meta.context;
      delete meta.correlationId;
      delete meta.userId;

      const contextPart = context ? `[${context}]` : '';
      const correlationPart = correlationId ? `[${correlationId}]` : '';
      const userPart = userId ? `[user:${userId}]` : '';
      const metaPart = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

      return `${timestamp} ${level}${contextPart}${correlationPart}${userPart}: ${message}${metaPart}`;
    }),
  );

const createJsonFormat = (): winston.Logform.Format =>
  winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf((info: winston.Logform.TransformableInfo): string => {
      const i = info as LogInfo;
      const timestamp = String(i.timestamp ?? '');
      const level = String(i.level ?? '');
      const message = String(i.message ?? '');
      const context = i.context;
      const trace = i.trace;

      const meta = { ...i } as Record<string, unknown>;
      delete meta.timestamp;
      delete meta.level;
      delete meta.message;
      delete meta.context;
      delete meta.trace;

      const requestContext = RequestContextService.getContext();

      const logEntry: Record<string, unknown> = {
        timestamp,
        level,
        message,
        service: 'meal-plan-management-service',
        ...meta,
      };

      if (context) logEntry.context = context;
      if (requestContext?.correlationId) logEntry.correlationId = requestContext.correlationId;
      if (requestContext?.userId) logEntry.userId = requestContext.userId;
      if (requestContext?.ip) logEntry.ip = requestContext.ip;
      if (trace) logEntry.trace = trace;

      return JSON.stringify(logEntry);
    }),
  );

export const createWinstonLogger = (configService: ConfigService): winston.LoggerOptions => {
  const loggingConfig = configService.get<LoggingConfig>('logging')!;

  const prettyFormat = createPrettyFormat();
  const jsonFormat = createJsonFormat();

  // use Transport[] from winston-transport
  const transports: Transport[] = [];

  // Console transport
  transports.push(
    new winston.transports.Console({
      level: loggingConfig.level,
      format: loggingConfig.consoleFormat === 'pretty' ? prettyFormat : jsonFormat,
    }),
  );

  // File transports with rotation
  if (loggingConfig.fileEnabled) {
    const fileTransportOptions = {
      level: loggingConfig.level,
      format: jsonFormat,
      dirname: loggingConfig.filePath,
      datePattern: loggingConfig.fileDatePattern,
      maxSize: loggingConfig.fileMaxSize,
      maxFiles: loggingConfig.fileMaxFiles,
      auditFile: `${loggingConfig.filePath}/.audit.json`,
      createSymlink: true,
      symlinkName: 'current.log',
    };

    // Combined logs (all levels)
    transports.push(
      new DailyRotateFile({
        ...fileTransportOptions,
        filename: 'application-%DATE%.log',
      }),
    );

    // Error logs (error level only)
    transports.push(
      new DailyRotateFile({
        ...fileTransportOptions,
        filename: 'error-%DATE%.log',
        level: 'error',
        symlinkName: 'current-error.log',
      }),
    );
  }

  return {
    level: loggingConfig.level,
    format: jsonFormat,
    transports,
    defaultMeta: { service: 'meal-plan-management-service' },
    exitOnError: false,
  };
};
