import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

export const createWinstonLogger = (configService: ConfigService) => {
  const logLevel = configService.get<string>('app.logLevel') ?? 'info';
  const nodeEnv = configService.get<string>('app.nodeEnv') ?? 'development';

  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
      const logEntry: Record<string, unknown> = {
        timestamp,
        level,
        message,
        context,
        ...meta,
      };

      if (trace) {
        logEntry.trace = trace;
      }

      return JSON.stringify(logEntry);
    }),
  );

  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: logLevel,
      format:
        nodeEnv === 'development'
          ? winston.format.combine(winston.format.colorize(), winston.format.simple())
          : logFormat,
    }),
  ];

  // Add file transport for production
  if (nodeEnv === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
      }),
    );
  }

  return {
    level: logLevel,
    format: logFormat,
    transports,
    defaultMeta: { service: 'meal-plan-management-service' },
  };
};
