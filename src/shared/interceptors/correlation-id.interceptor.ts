import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { RequestContextService, RequestContext } from '@/shared/services/request-context.service';

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

    // Create request context with correlation ID and other useful data
    const requestContext: RequestContext = {
      correlationId,
      ip: request.ip ?? request.socket.remoteAddress,
      userAgent: request.headers['user-agent'],
    };

    // Run the request handler within the context
    return new Observable((subscriber) => {
      RequestContextService.run(requestContext, () => {
        const handleResult = next.handle();
        handleResult.subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
