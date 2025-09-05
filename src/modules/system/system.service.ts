import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SystemService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      name: 'Meal Plan Management Service',
      version: '1.0.0',
      description: 'API for managing meal plans, recipes, and nutritional tracking',
      environment: this.configService.get<string>('app.nodeEnv'),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      pid: process.pid,
    };
  }

  /**
   * Get safe configuration values (non-sensitive only)
   */
  getConfiguration() {
    return {
      environment: this.configService.get<string>('app.nodeEnv'),
      port: this.configService.get<number>('app.port'),
      logLevel: this.configService.get<string>('app.logLevel'),
      corsOrigins: this.configService.get<string[]>('app.corsOrigins'),
      rateLimit: {
        ttl: this.configService.get<number>('rateLimit.ttl'),
        limit: this.configService.get<number>('rateLimit.limit'),
      },
      database: {
        maxRetries: this.configService.get<number>('database.maxRetries'),
        retryDelay: this.configService.get<number>('database.retryDelay'),
        healthCheckInterval: this.configService.get<number>('database.healthCheckInterval'),
        logQueries: this.configService.get<boolean>('database.logQueries'),
      },
      oauth2: {
        serviceEnabled: this.configService.get<boolean>('oauth2.serviceEnabled'),
        serviceToServiceEnabled: this.configService.get<boolean>('oauth2.serviceToServiceEnabled'),
        introspectionEnabled: this.configService.get<boolean>('oauth2.introspectionEnabled'),
        clientId: this.configService.get<string>('oauth2.clientId'),
        // Note: We explicitly exclude sensitive values like secrets, passwords, URLs with credentials
      },
      logging: {
        level: this.configService.get<string>('logging.level'),
        consoleFormat: this.configService.get<string>('logging.consoleFormat'),
        fileEnabled: this.configService.get<boolean>('logging.fileEnabled'),
        maxSize: this.configService.get<string>('logging.maxSize'),
        maxFiles: this.configService.get<string>('logging.maxFiles'),
      },
    };
  }
}
