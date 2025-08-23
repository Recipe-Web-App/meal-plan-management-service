import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '@/shared/interfaces';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    const errorResponse: ApiResponse = {
      success: false,
      message,
      errors: exception instanceof HttpException ? [exception.message] : [],
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify({
        statusCode: status,
        timestamp: errorResponse.timestamp,
        path: request.url,
        error: exception,
      }),
      HttpExceptionFilter.name,
    );

    response.status(status).json(errorResponse);
  }
}
