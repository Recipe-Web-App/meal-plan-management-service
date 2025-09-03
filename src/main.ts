import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@/shared/filters/http-exception.filter';
import { ResponseInterceptor } from '@/shared/interceptors/response.interceptor';
import { CorrelationIdInterceptor } from '@/shared/interceptors/correlation-id.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? ['*'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validateCustomDecorators: true,
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new CorrelationIdInterceptor(), new ResponseInterceptor());

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Meal Plan Management Service')
    .setDescription(
      `
# Meal Plan Management API

A comprehensive REST API for managing meal plans, recipes, and nutritional tracking within the Recipe Web App ecosystem.

## Authentication

This API uses OAuth2 with JWT Bearer tokens for authentication. All endpoints (except health checks) require a valid access token.

### How to Authenticate

1. **Obtain a JWT token** from your OAuth2 authorization server
2. **Include the token** in the Authorization header of your requests:
   \`\`\`
   Authorization: Bearer YOUR_JWT_TOKEN
   \`\`\`

### Token Requirements

- **Format**: JWT (JSON Web Token)
- **Type**: Bearer token in Authorization header
- **Scopes**: Tokens must include appropriate scopes (read, write)
- **Expiration**: Tokens have limited lifetime and must be refreshed

### Service-to-Service Authentication

For microservice communication, services can obtain tokens using OAuth2 client credentials:

1. Request token with client credentials
2. Use token for authenticated requests
3. Tokens are cached and automatically refreshed

## Error Responses

Authentication errors return standard HTTP status codes:

- **401 Unauthorized**: Missing, invalid, or expired token
- **403 Forbidden**: Valid token but insufficient permissions
- **429 Too Many Requests**: Rate limit exceeded

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Default**: 100 requests per minute
- **Create/Update**: 10-20 requests per minute
- **Delete**: 10 requests per minute

Rate limits are enforced per authenticated user or service.
    `,
    )
    .setVersion('1.0')
    .addTag('meal-plans', 'Meal plan management endpoints')
    .addTag('health', 'Health check and monitoring endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: `
Enter your JWT access token. The token should be obtained from your OAuth2 authorization server.

**Format**: \`Bearer YOUR_JWT_TOKEN\`

**Example**: \`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\`

**Note**: The 'Bearer ' prefix will be added automatically.
        `,
      },
      'JWT-Auth',
    )
    .addSecurityRequirements('JWT-Auth')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.example.com', 'Production server')
    .setContact(
      'Recipe Web App Team',
      'https://github.com/recipe-web-app/meal-plan-management-service',
      'support@example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
}
void bootstrap();
