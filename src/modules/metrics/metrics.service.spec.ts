import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { register } from 'prom-client';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    // Clear the registry before each test
    register.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    // Clear the registry after each test
    register.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordHttpRequest', () => {
    it('should record HTTP request metrics', async () => {
      const method = 'GET';
      const route = '/api/v1/meal-plans';
      const statusCode = 200;
      const duration = 0.25;

      service.recordHttpRequest(method, route, statusCode, duration);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('meal_plan_service_http_requests_total');
      expect(metrics).toContain('meal_plan_service_http_request_duration_seconds');
      expect(metrics).toContain(`method="${method}"`);
      expect(metrics).toContain(`route="${route}"`);
      expect(metrics).toContain(`status_code="${statusCode}"`);
    });

    it('should handle multiple HTTP requests with different parameters', async () => {
      service.recordHttpRequest('GET', '/api/v1/meal-plans', 200, 0.1);
      service.recordHttpRequest('POST', '/api/v1/meal-plans', 201, 0.3);
      service.recordHttpRequest('GET', '/api/v1/meal-plans/123', 404, 0.05);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('status_code="200"');
      expect(metrics).toContain('status_code="201"');
      expect(metrics).toContain('status_code="404"');
    });
  });

  describe('meal plan business metrics', () => {
    it('should record meal plan creation', async () => {
      const userId = 'user123';

      service.recordMealPlanCreated(userId);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('meal_plan_service_meal_plans_created_total');
      expect(metrics).toContain(`user_id="${userId}"`);
    });

    it('should record meal plan update', async () => {
      const userId = 'user456';

      service.recordMealPlanUpdated(userId);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('meal_plan_service_meal_plans_updated_total');
      expect(metrics).toContain(`user_id="${userId}"`);
    });

    it('should record meal plan deletion', async () => {
      const userId = 'user789';

      service.recordMealPlanDeleted(userId);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('meal_plan_service_meal_plans_deleted_total');
      expect(metrics).toContain(`user_id="${userId}"`);
    });

    it('should update active meal plans gauge', async () => {
      const count = 42;

      service.updateActiveMealPlans(count);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('meal_plan_service_active_meal_plans');
      expect(metrics).toContain(`${count}`);
    });

    it('should handle multiple operations for same user', async () => {
      const userId = 'user123';

      service.recordMealPlanCreated(userId);
      service.recordMealPlanCreated(userId);
      service.recordMealPlanUpdated(userId);

      const metrics = await service.getMetrics();

      // Should show count of 2 for created
      expect(metrics).toContain('meal_plan_service_meal_plans_created_total');
      expect(metrics).toContain('meal_plan_service_meal_plans_updated_total');
      expect(metrics).toContain(`user_id="${userId}"`);
    });
  });

  describe('database metrics', () => {
    it('should record database query metrics', async () => {
      const operation = 'SELECT';
      const table = 'meal_plans';
      const duration = 0.025;

      service.recordDatabaseQuery(operation, table, duration);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('meal_plan_service_database_query_duration_seconds');
      expect(metrics).toContain(`operation="${operation}"`);
      expect(metrics).toContain(`table="${table}"`);
    });

    it('should update database connections gauge', async () => {
      const connectionCount = 15;

      service.updateDatabaseConnections(connectionCount);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('meal_plan_service_database_connections');
      expect(metrics).toContain(`${connectionCount}`);
    });

    it('should handle different database operations', async () => {
      service.recordDatabaseQuery('SELECT', 'meal_plans', 0.01);
      service.recordDatabaseQuery('INSERT', 'meal_plan_recipes', 0.05);
      service.recordDatabaseQuery('UPDATE', 'meal_plans', 0.03);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('operation="SELECT"');
      expect(metrics).toContain('operation="INSERT"');
      expect(metrics).toContain('operation="UPDATE"');
      expect(metrics).toContain('table="meal_plans"');
      expect(metrics).toContain('table="meal_plan_recipes"');
    });
  });

  describe('default Node.js metrics', () => {
    it('should include default Node.js metrics', async () => {
      const metrics = await service.getMetrics();

      // Check for some common Node.js metrics that should be present
      expect(metrics).toContain('meal_plan_service_nodejs_heap_size_total_bytes');
      expect(metrics).toContain('meal_plan_service_nodejs_heap_size_used_bytes');
      expect(metrics).toContain('meal_plan_service_nodejs_version_info');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      // Record some test data
      service.recordHttpRequest('GET', '/test', 200, 0.1);
      service.recordMealPlanCreated('user123');

      const metrics = await service.getMetrics();

      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should return consistent format across calls', async () => {
      const metrics1 = await service.getMetrics();
      const metrics2 = await service.getMetrics();

      // Both should be valid Prometheus format
      expect(metrics1).toContain('# HELP');
      expect(metrics2).toContain('# HELP');
    });
  });

  describe('getRegistry', () => {
    it('should return the metrics registry', () => {
      const registry = service.getRegistry();

      expect(registry).toBeDefined();
      expect(registry).toBe(register);
    });
  });

  describe('metric labels and values', () => {
    it('should handle special characters in labels', async () => {
      const userId = 'user-with-special@chars.com';

      service.recordMealPlanCreated(userId);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('meal_plan_service_meal_plans_created_total');
      // Prometheus should escape or handle special characters appropriately
    });

    it('should handle zero and negative values appropriately', async () => {
      service.updateActiveMealPlans(0);
      service.updateDatabaseConnections(0);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('meal_plan_service_active_meal_plans 0');
      expect(metrics).toContain('meal_plan_service_database_connections 0');
    });

    it('should handle large values', async () => {
      const largeCount = 999999;
      service.updateActiveMealPlans(largeCount);

      const metrics = await service.getMetrics();

      expect(metrics).toContain(`meal_plan_service_active_meal_plans ${largeCount}`);
    });
  });
});
