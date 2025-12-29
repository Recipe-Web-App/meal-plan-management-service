import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestContextService, RequestContext } from './request-context.service';

describe('RequestContextService', () => {
  let service: RequestContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestContextService],
    }).compile();

    service = module.get<RequestContextService>(RequestContextService);
  });

  afterEach(() => {
    // Clear any existing context
    RequestContextService.run({ correlationId: 'test' }, () => {
      // This ensures we reset the context after each test
    });
  });

  describe('static methods', () => {
    describe('run', () => {
      it('should run callback within provided context', () => {
        const context: RequestContext = {
          correlationId: 'test-correlation-id',
          userId: 'user123',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
        };

        let contextInCallback: RequestContext | undefined;

        const result = RequestContextService.run(context, () => {
          contextInCallback = RequestContextService.getContext();
          return 'callback result';
        });

        expect(result).toBe('callback result');
        expect(contextInCallback).toEqual(context);
      });

      it('should isolate context between different runs', () => {
        const context1: RequestContext = { correlationId: 'id1' };
        const context2: RequestContext = { correlationId: 'id2' };

        let contextInCallback1: RequestContext | undefined;
        let contextInCallback2: RequestContext | undefined;

        RequestContextService.run(context1, () => {
          contextInCallback1 = RequestContextService.getContext();
        });

        RequestContextService.run(context2, () => {
          contextInCallback2 = RequestContextService.getContext();
        });

        expect(contextInCallback1?.correlationId).toBe('id1');
        expect(contextInCallback2?.correlationId).toBe('id2');
      });

      it('should handle async operations', async () => {
        const context: RequestContext = { correlationId: 'async-test' };

        const result = await RequestContextService.run(context, async () => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return RequestContextService.getCorrelationId();
        });

        expect(result).toBe('async-test');
      });
    });

    describe('getContext', () => {
      it('should return undefined when no context is set', () => {
        const context = RequestContextService.getContext();
        expect(context).toBeUndefined();
      });

      it('should return current context when set', () => {
        const expectedContext: RequestContext = {
          correlationId: 'test-id',
          userId: 'user123',
        };

        RequestContextService.run(expectedContext, () => {
          const context = RequestContextService.getContext();
          expect(context).toEqual(expectedContext);
        });
      });
    });

    describe('getCorrelationId', () => {
      it('should return undefined when no context', () => {
        const correlationId = RequestContextService.getCorrelationId();
        expect(correlationId).toBeUndefined();
      });

      it('should return correlation ID from context', () => {
        const context: RequestContext = { correlationId: 'test-correlation-id' };

        RequestContextService.run(context, () => {
          const correlationId = RequestContextService.getCorrelationId();
          expect(correlationId).toBe('test-correlation-id');
        });
      });
    });

    describe('setCorrelationId', () => {
      it('should do nothing when no context exists', () => {
        RequestContextService.setCorrelationId('new-id');
        const correlationId = RequestContextService.getCorrelationId();
        expect(correlationId).toBeUndefined();
      });

      it('should update correlation ID in existing context', () => {
        const context: RequestContext = { correlationId: 'original-id' };

        RequestContextService.run(context, () => {
          RequestContextService.setCorrelationId('updated-id');
          const correlationId = RequestContextService.getCorrelationId();
          expect(correlationId).toBe('updated-id');
        });
      });
    });

    describe('getUserId', () => {
      it('should return undefined when no context', () => {
        const userId = RequestContextService.getUserId();
        expect(userId).toBeUndefined();
      });

      it('should return undefined when context has no userId', () => {
        const context: RequestContext = { correlationId: 'test-id' };

        RequestContextService.run(context, () => {
          const userId = RequestContextService.getUserId();
          expect(userId).toBeUndefined();
        });
      });

      it('should return user ID from context', () => {
        const context: RequestContext = {
          correlationId: 'test-id',
          userId: 'user123',
        };

        RequestContextService.run(context, () => {
          const userId = RequestContextService.getUserId();
          expect(userId).toBe('user123');
        });
      });
    });

    describe('setUserId', () => {
      it('should do nothing when no context exists', () => {
        RequestContextService.setUserId('user123');
        const userId = RequestContextService.getUserId();
        expect(userId).toBeUndefined();
      });

      it('should update user ID in existing context', () => {
        const context: RequestContext = { correlationId: 'test-id' };

        RequestContextService.run(context, () => {
          RequestContextService.setUserId('user123');
          const userId = RequestContextService.getUserId();
          expect(userId).toBe('user123');
        });
      });

      it('should update existing user ID in context', () => {
        const context: RequestContext = {
          correlationId: 'test-id',
          userId: 'original-user',
        };

        RequestContextService.run(context, () => {
          RequestContextService.setUserId('updated-user');
          const userId = RequestContextService.getUserId();
          expect(userId).toBe('updated-user');
        });
      });
    });
  });

  describe('instance methods', () => {
    describe('getCorrelationId', () => {
      it('should return undefined when no context', () => {
        const correlationId = service.getCorrelationId();
        expect(correlationId).toBeUndefined();
      });

      it('should return correlation ID from context', () => {
        const context: RequestContext = { correlationId: 'instance-test-id' };

        RequestContextService.run(context, () => {
          const correlationId = service.getCorrelationId();
          expect(correlationId).toBe('instance-test-id');
        });
      });
    });

    describe('getUserId', () => {
      it('should return undefined when no context', () => {
        const userId = service.getUserId();
        expect(userId).toBeUndefined();
      });

      it('should return user ID from context', () => {
        const context: RequestContext = {
          correlationId: 'test-id',
          userId: 'instance-user123',
        };

        RequestContextService.run(context, () => {
          const userId = service.getUserId();
          expect(userId).toBe('instance-user123');
        });
      });
    });

    describe('getFullContext', () => {
      it('should return undefined when no context', () => {
        const context = service.getFullContext();
        expect(context).toBeUndefined();
      });

      it('should return full context', () => {
        const expectedContext: RequestContext = {
          correlationId: 'full-context-id',
          userId: 'user123',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        };

        RequestContextService.run(expectedContext, () => {
          const context = service.getFullContext();
          expect(context).toEqual(expectedContext);
        });
      });
    });
  });

  describe('nested contexts', () => {
    it('should handle nested context runs', () => {
      const outerContext: RequestContext = { correlationId: 'outer-id' };
      const innerContext: RequestContext = { correlationId: 'inner-id' };

      let outerContextId: string | undefined;
      let innerContextId: string | undefined;
      let backToOuterContextId: string | undefined;

      RequestContextService.run(outerContext, () => {
        outerContextId = RequestContextService.getCorrelationId();

        RequestContextService.run(innerContext, () => {
          innerContextId = RequestContextService.getCorrelationId();
        });

        backToOuterContextId = RequestContextService.getCorrelationId();
      });

      expect(outerContextId).toBe('outer-id');
      expect(innerContextId).toBe('inner-id');
      expect(backToOuterContextId).toBe('outer-id');
    });
  });

  describe('context mutations', () => {
    it('should maintain mutations within the same context', () => {
      const context: RequestContext = { correlationId: 'original-id' };

      RequestContextService.run(context, () => {
        // Initial state
        expect(RequestContextService.getCorrelationId()).toBe('original-id');
        expect(RequestContextService.getUserId()).toBeUndefined();

        // Mutate context
        RequestContextService.setCorrelationId('mutated-id');
        RequestContextService.setUserId('new-user');

        // Check mutations
        expect(RequestContextService.getCorrelationId()).toBe('mutated-id');
        expect(RequestContextService.getUserId()).toBe('new-user');

        const fullContext = RequestContextService.getContext();
        expect(fullContext?.correlationId).toBe('mutated-id');
        expect(fullContext?.userId).toBe('new-user');
      });
    });

    it('should not affect context outside of run block', () => {
      // Context outside should be undefined
      expect(RequestContextService.getContext()).toBeUndefined();

      const context: RequestContext = { correlationId: 'test-id' };

      RequestContextService.run(context, () => {
        RequestContextService.setUserId('temp-user');
      });

      // Context outside should still be undefined
      expect(RequestContextService.getContext()).toBeUndefined();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
