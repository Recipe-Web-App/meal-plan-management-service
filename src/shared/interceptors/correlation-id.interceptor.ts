import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

interface RequestWithCorrelationId extends Request {
  correlationId: string;
}

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithCorrelationId>();
    const response = context.switchToHttp().getResponse<Response>();

    const correlationId = (request.headers['x-correlation-id'] as string) ?? uuidv4();

    request.correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    return next.handle();
  }
}
