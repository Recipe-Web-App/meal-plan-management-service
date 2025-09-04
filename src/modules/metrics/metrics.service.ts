import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, register, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  // HTTP metrics
  private readonly httpRequestDurationHistogram: Histogram<string>;
  private readonly httpRequestCounter: Counter<string>;

  // Business metrics
  private readonly mealPlansCreatedCounter: Counter<string>;
  private readonly mealPlansUpdatedCounter: Counter<string>;
  private readonly mealPlansDeletedCounter: Counter<string>;
  private readonly activeMealPlansGauge: Gauge<string>;

  // Database metrics
  private readonly databaseQueryDurationHistogram: Histogram<string>;
  private readonly databaseConnectionsGauge: Gauge<string>;

  constructor() {
    // Enable default Node.js metrics collection
    collectDefaultMetrics({ prefix: 'meal_plan_service_' });

    // HTTP Request Duration
    this.httpRequestDurationHistogram = new Histogram({
      name: 'meal_plan_service_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    // HTTP Request Counter
    this.httpRequestCounter = new Counter({
      name: 'meal_plan_service_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // Business Metrics - Meal Plans
    this.mealPlansCreatedCounter = new Counter({
      name: 'meal_plan_service_meal_plans_created_total',
      help: 'Total number of meal plans created',
      labelNames: ['user_id'],
    });

    this.mealPlansUpdatedCounter = new Counter({
      name: 'meal_plan_service_meal_plans_updated_total',
      help: 'Total number of meal plans updated',
      labelNames: ['user_id'],
    });

    this.mealPlansDeletedCounter = new Counter({
      name: 'meal_plan_service_meal_plans_deleted_total',
      help: 'Total number of meal plans deleted',
      labelNames: ['user_id'],
    });

    this.activeMealPlansGauge = new Gauge({
      name: 'meal_plan_service_active_meal_plans',
      help: 'Number of currently active meal plans',
    });

    // Database Metrics
    this.databaseQueryDurationHistogram = new Histogram({
      name: 'meal_plan_service_database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.databaseConnectionsGauge = new Gauge({
      name: 'meal_plan_service_database_connections',
      help: 'Number of active database connections',
    });
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    const labels = { method, route, status_code: statusCode.toString() };
    this.httpRequestCounter.inc(labels);
    this.httpRequestDurationHistogram.observe(labels, duration);
  }

  /**
   * Record meal plan creation
   */
  recordMealPlanCreated(userId: string): void {
    this.mealPlansCreatedCounter.inc({ user_id: userId });
  }

  /**
   * Record meal plan update
   */
  recordMealPlanUpdated(userId: string): void {
    this.mealPlansUpdatedCounter.inc({ user_id: userId });
  }

  /**
   * Record meal plan deletion
   */
  recordMealPlanDeleted(userId: string): void {
    this.mealPlansDeletedCounter.inc({ user_id: userId });
  }

  /**
   * Update active meal plans gauge
   */
  updateActiveMealPlans(count: number): void {
    this.activeMealPlansGauge.set(count);
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    this.databaseQueryDurationHistogram.observe({ operation, table }, duration);
  }

  /**
   * Update database connections gauge
   */
  updateDatabaseConnections(count: number): void {
    this.databaseConnectionsGauge.set(count);
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Get metrics registry for health checks
   */
  getRegistry() {
    return register;
  }
}
