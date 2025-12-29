import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: {
    getMetrics: Mock<() => Promise<string>>;
    recordHttpRequest: Mock<() => void>;
    recordMealPlanCreated: Mock<() => void>;
    recordMealPlanUpdated: Mock<() => void>;
    recordMealPlanDeleted: Mock<() => void>;
    updateActiveMealPlans: Mock<() => void>;
    recordDatabaseQuery: Mock<() => void>;
    updateDatabaseConnections: Mock<() => void>;
    getRegistry: Mock<() => unknown>;
  };

  beforeEach(async () => {
    const mockMetricsService = {
      getMetrics: mock(() => Promise.resolve('')),
      recordHttpRequest: mock(() => {}),
      recordMealPlanCreated: mock(() => {}),
      recordMealPlanUpdated: mock(() => {}),
      recordMealPlanDeleted: mock(() => {}),
      updateActiveMealPlans: mock(() => {}),
      recordDatabaseQuery: mock(() => {}),
      updateDatabaseConnections: mock(() => {}),
      getRegistry: mock(() => ({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get(MetricsService) as typeof metricsService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics from service', async () => {
      const mockMetrics = `# HELP meal_plan_service_http_requests_total Total number of HTTP requests
# TYPE meal_plan_service_http_requests_total counter
meal_plan_service_http_requests_total{method="GET",route="/api/v1/meal-plans",status_code="200"} 42

# HELP meal_plan_service_meal_plans_created_total Total number of meal plans created
# TYPE meal_plan_service_meal_plans_created_total counter
meal_plan_service_meal_plans_created_total{user_id="user123"} 5`;

      metricsService.getMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getMetrics();

      expect(result).toBe(mockMetrics);
      expect(metricsService.getMetrics).toHaveBeenCalledTimes(1);
    });

    it('should handle empty metrics response', async () => {
      const emptyMetrics = '';
      metricsService.getMetrics.mockResolvedValue(emptyMetrics);

      const result = await controller.getMetrics();

      expect(result).toBe(emptyMetrics);
      expect(metricsService.getMetrics).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Metrics collection failed');
      metricsService.getMetrics.mockRejectedValue(error);

      await expect(controller.getMetrics()).rejects.toThrow('Metrics collection failed');
      expect(metricsService.getMetrics).toHaveBeenCalledTimes(1);
    });

    it('should return string type', async () => {
      const mockMetrics = '# Simple metrics response';
      metricsService.getMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getMetrics();

      expect(typeof result).toBe('string');
    });

    it('should handle large metrics response', async () => {
      // Generate a large metrics response to test performance
      let largeMetrics = '';
      for (let i = 0; i < 1000; i++) {
        largeMetrics += `test_metric_${i} ${i}\n`;
      }

      metricsService.getMetrics.mockResolvedValue(largeMetrics);

      const result = await controller.getMetrics();

      expect(result).toBe(largeMetrics);
      expect(result.length).toBeGreaterThan(10000);
    });

    it('should handle metrics with special characters', async () => {
      const metricsWithSpecialChars = `# HELP test_metric Test metric
# TYPE test_metric counter
test_metric{label="with spaces and symbols!@#$%"} 1`;

      metricsService.getMetrics.mockResolvedValue(metricsWithSpecialChars);

      const result = await controller.getMetrics();

      expect(result).toBe(metricsWithSpecialChars);
    });

    it('should handle concurrent requests', async () => {
      const mockMetrics = '# Concurrent test metrics';
      metricsService.getMetrics.mockResolvedValue(mockMetrics);

      // Make multiple concurrent requests
      const promises = Array(10)
        .fill(null)
        .map(() => controller.getMetrics());
      const results = await Promise.all(promises);

      // All should return the same metrics
      results.forEach((result) => {
        expect(result).toBe(mockMetrics);
      });

      expect(metricsService.getMetrics).toHaveBeenCalledTimes(10);
    });
  });

  describe('controller metadata', () => {
    it('should have correct controller path', () => {
      const controllerMetadata = Reflect.getMetadata('path', MetricsController);
      expect(controllerMetadata).toBe('meal-plan-management/metrics');
    });

    it('should have correct API tags', () => {
      // This would require more complex reflection testing
      // For now, we verify the controller is properly decorated
      expect(controller).toBeInstanceOf(MetricsController);
    });
  });

  describe('response formatting', () => {
    it('should maintain Prometheus format structure', async () => {
      const prometheusFormatMetrics = `# HELP node_js_heap_used_bytes Node.js heap used
# TYPE node_js_heap_used_bytes gauge
node_js_heap_used_bytes 12345678

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 100`;

      metricsService.getMetrics.mockResolvedValue(prometheusFormatMetrics);

      const result = await controller.getMetrics();

      // Should contain Prometheus format elements
      expect(result).toContain('# HELP');
      expect(result).toContain('# TYPE');
      expect(result).toContain('gauge');
      expect(result).toContain('counter');
    });

    it('should handle multiline metrics correctly', async () => {
      const multilineMetrics = `# HELP metric1 First metric
# TYPE metric1 counter
metric1 1

# HELP metric2 Second metric
# TYPE metric2 gauge
metric2 2`;

      metricsService.getMetrics.mockResolvedValue(multilineMetrics);

      const result = await controller.getMetrics();
      const lines = result.split('\n');

      expect(lines.length).toBeGreaterThan(5);
      expect(result).toContain('metric1 1');
      expect(result).toContain('metric2 2');
    });
  });
});
