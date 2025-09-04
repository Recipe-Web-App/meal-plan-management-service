import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('meal-plan-management/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
    summary: 'Get Prometheus metrics',
    description: 'Returns application metrics in Prometheus format for monitoring and alerting',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics data in Prometheus format',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: `# HELP meal_plan_service_http_requests_total Total number of HTTP requests
# TYPE meal_plan_service_http_requests_total counter
meal_plan_service_http_requests_total{method="GET",route="/api/v1/meal-plans",status_code="200"} 45

# HELP meal_plan_service_meal_plans_created_total Total number of meal plans created
# TYPE meal_plan_service_meal_plans_created_total counter
meal_plan_service_meal_plans_created_total{user_id="user123"} 12`,
        },
      },
    },
  })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
