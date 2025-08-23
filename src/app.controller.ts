import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { LoggerService } from '@/shared';

@Controller('meal-plan-management')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  getHello(): string {
    this.logger.info(
      'Hello endpoint called',
      { endpoint: '/meal-plan-management' },
      'AppController',
    );

    const result = this.appService.getHello();

    this.logger.debug('Hello endpoint returning result', { result }, 'AppController');

    return result;
  }

  @Get('test-logging')
  testLogging(): { message: string; correlationId?: string | undefined } {
    this.logger.info('Testing logging functionality', {}, 'AppController');
    this.logger.warn('This is a warning message', { testData: 'sample' }, 'AppController');
    this.logger.error('This is an error message', 'Error stack trace here', 'AppController');

    // Test different log methods
    this.logger.logWithMeta(
      'info',
      'Custom structured log',
      {
        customField: 'value',
        number: 42,
        nested: { data: 'test' },
      },
      'AppController',
    );

    // Test HTTP request logging
    this.logger.logRequest('GET', '/test-logging', 200, 150);

    // Test database operation logging
    this.logger.logDatabaseOperation('SELECT', 'meal_plans', 25, 5);

    // Test external call logging
    this.logger.logExternalCall('recipe-service', 'GET', '/api/recipes/123', 200, 350);

    // Test security event logging
    this.logger.logSecurityEvent('test_event', { source: 'logging_test' });

    return {
      message: 'Logging test completed - check console and log files',
      correlationId: this.logger.getCorrelationId(),
    };
  }
}
