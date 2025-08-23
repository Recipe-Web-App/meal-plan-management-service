import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId: string;
  userId?: string | undefined;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

@Injectable()
export class RequestContextService {
  private static asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  static run<T>(context: RequestContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  static getContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  static getCorrelationId(): string | undefined {
    return this.getContext()?.correlationId;
  }

  static setCorrelationId(correlationId: string): void {
    const context = this.getContext();
    if (context) {
      context.correlationId = correlationId;
    }
  }

  static getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  static setUserId(userId: string): void {
    const context = this.getContext();
    if (context) {
      context.userId = userId;
    }
  }

  getCorrelationId(): string | undefined {
    return RequestContextService.getCorrelationId();
  }

  getUserId(): string | undefined {
    return RequestContextService.getUserId();
  }

  getFullContext(): RequestContext | undefined {
    return RequestContextService.getContext();
  }
}
