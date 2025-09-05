import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SystemService } from './system.service';

@ApiTags('system')
@Controller('meal-plan-management')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('info')
  @ApiOperation({
    summary: 'Get service information',
    description:
      'Returns basic service information including version, environment, and runtime details',
  })
  @ApiResponse({
    status: 200,
    description: 'Service information',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Meal Plan Management Service' },
            version: { type: 'string', example: '1.0.0' },
            description: { type: 'string' },
            environment: { type: 'string', example: 'development' },
            uptime: { type: 'number', description: 'Service uptime in seconds' },
            timestamp: { type: 'string', format: 'date-time' },
            nodeVersion: { type: 'string', example: 'v18.17.0' },
            platform: { type: 'string', example: 'linux' },
            arch: { type: 'string', example: 'x64' },
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number', description: 'Used heap memory in MB' },
                total: { type: 'number', description: 'Total heap memory in MB' },
                external: { type: 'number', description: 'External memory in MB' },
              },
            },
            pid: { type: 'number', description: 'Process ID' },
          },
        },
      },
    },
  })
  getInfo() {
    return this.systemService.getServiceInfo();
  }

  @Get('config')
  @ApiOperation({
    summary: 'Get safe configuration values',
    description:
      'Returns non-sensitive configuration values for debugging and verification. Sensitive values like secrets and passwords are excluded.',
  })
  @ApiResponse({
    status: 200,
    description: 'Safe configuration values',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            environment: { type: 'string', example: 'development' },
            port: { type: 'number', example: 3000 },
            logLevel: { type: 'string', example: 'info' },
            corsOrigins: {
              type: 'array',
              items: { type: 'string' },
              example: ['http://localhost:3000'],
            },
            rateLimit: {
              type: 'object',
              properties: {
                ttl: { type: 'number', description: 'Rate limit window in ms' },
                limit: { type: 'number', description: 'Max requests per window' },
              },
            },
            database: {
              type: 'object',
              properties: {
                maxRetries: { type: 'number' },
                retryDelay: { type: 'number' },
                healthCheckInterval: { type: 'number' },
                logQueries: { type: 'boolean' },
              },
            },
            oauth2: {
              type: 'object',
              properties: {
                serviceEnabled: { type: 'boolean' },
                serviceToServiceEnabled: { type: 'boolean' },
                introspectionEnabled: { type: 'boolean' },
                clientId: { type: 'string' },
              },
            },
            logging: {
              type: 'object',
              properties: {
                level: { type: 'string' },
                consoleFormat: { type: 'string' },
                fileEnabled: { type: 'boolean' },
                maxSize: { type: 'string' },
                maxFiles: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  getConfig() {
    return this.systemService.getConfiguration();
  }
}
