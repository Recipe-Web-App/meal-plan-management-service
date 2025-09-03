# Authentication Guide

This document provides comprehensive information about the OAuth2 authentication system implemented in the Meal Plan Management Service.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Authentication Methods](#authentication-methods)
- [Configuration](#configuration)
- [API Usage](#api-usage)
- [Security Features](#security-features)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)

## Overview

The Meal Plan Management Service implements a robust OAuth2 authentication system with JWT tokens, supporting both user authentication and service-to-service communication. The system is built using NestJS with Passport.js and provides flexible configuration options for different deployment environments.

### Key Features

- **OAuth2 with JWT**: Industry-standard authentication using JSON Web Tokens
- **Dual Validation**: Supports both local JWT validation and remote token introspection
- **Service-to-Service**: Client credentials flow for microservice communication
- **Token Caching**: Intelligent caching with configurable TTL for performance
- **Security Guards**: NestJS guards for protecting endpoints and validating permissions
- **Flexible Configuration**: Environment-based configuration for different deployment scenarios

## Architecture

### Authentication Flow

```mermaid
graph TD
    A[Client Request] --> B{Has Bearer Token?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D[JWT Auth Guard]
    D --> E{OAuth2 Enabled?}
    E -->|No| F[Allow Request]
    E -->|Yes| G[Token Validation Service]
    G --> H{Introspection Enabled?}
    H -->|No| I[Local JWT Validation]
    H -->|Yes| J[Remote Introspection]
    I --> K{Valid Token?}
    J --> K
    K -->|No| L[401 Unauthorized]
    K -->|Yes| M[Extract User Info]
    M --> N[Attach User to Request]
    N --> O[Allow Request]
```

### Core Components

#### 1. Guards

- **`JwtAuthGuard`**: Primary authentication guard for user requests
- **`ServiceAuthGuard`**: Authentication guard for service-to-service communication

#### 2. Strategies

- **`JwtStrategy`**: Passport strategy for JWT token extraction and validation

#### 3. Services

- **`AuthService`**: Main authentication service providing configuration checks
- **`TokenValidationService`**: Handles token validation via local JWT or remote introspection
- **`ServiceAuthService`**: Manages service-to-service authentication and token caching

#### 4. Decorators

- **`@CurrentUser()`**: Parameter decorator to inject authenticated user information

## Authentication Methods

### 1. JWT User Authentication

Used for user-facing API requests with JWT tokens issued by the OAuth2 authorization server.

**Flow:**

1. User obtains JWT token from auth service
2. Client includes token in `Authorization: Bearer <token>` header
3. `JwtAuthGuard` validates token and extracts user information
4. Request proceeds with authenticated user context

**Token Structure:**

```typescript
interface JwtPayload {
  iss: string; // Issuer (auth-service)
  sub: string; // Subject (user ID)
  client_id: string; // OAuth2 client ID
  user_id: string; // User ID
  scopes: string[]; // Granted scopes
  type: 'access_token'; // Token type
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}
```

### 2. Service-to-Service Authentication

Used for inter-service communication using OAuth2 client credentials flow.

**Flow:**

1. Service requests token using client credentials
2. Auth service returns access token
3. Service includes token in requests to other services
4. `ServiceAuthGuard` validates token and checks scopes
5. Request proceeds if service has required permissions

**Required Scopes:**

- `read`: Required for GET requests
- `write`: Required for POST, PUT, DELETE requests

### 3. Token Validation Modes

#### Local JWT Validation (Default)

- Validates tokens locally using JWT secret
- Faster performance, no network requests
- Suitable for development and trusted environments

#### Remote Token Introspection

- Validates tokens by calling OAuth2 introspection endpoint
- Real-time validation with centralized revocation support
- Recommended for production environments
- Includes intelligent caching to minimize network calls

## Configuration

### Environment Variables

#### Core OAuth2 Configuration

```bash
# Enable/disable OAuth2 authentication
OAUTH2_SERVICE_ENABLED=true

# Enable service-to-service authentication
OAUTH2_SERVICE_TO_SERVICE_ENABLED=true

# Enable remote token introspection
OAUTH2_INTROSPECTION_ENABLED=false

# OAuth2 client credentials
OAUTH2_CLIENT_ID=meal-plan-service
OAUTH2_CLIENT_SECRET=your-secret-key

# Auth service base URL
OAUTH2_AUTH_BASE_URL=https://auth-service.local/api/v1/auth
```

#### JWT Configuration

```bash
# JWT secret for local validation
JWT_SECRET=your-jwt-secret

# JWT token expiration
JWT_EXPIRES_IN=1d
```

### Static Configuration

The service includes static OAuth2 configuration in `src/config/oauth2.config.ts`:

```typescript
export const oauth2Config = {
  authBaseUrl: process.env.OAUTH2_AUTH_BASE_URL ?? 'https://auth-service.local/api/v1/auth',
  issuer: 'auth-service',
  scopes: ['read', 'write'],
  endpoints: {
    token: '/oauth2/token',
    introspect: '/oauth2/introspect',
    userinfo: '/oauth2/userinfo',
    revoke: '/oauth2/revoke',
  },
  tokenCacheTTL: 3300000, // 55 minutes
  introspectionCacheTTL: 60000, // 1 minute
  tokenRefreshBuffer: 30000, // 30 seconds
};
```

### Configuration Profiles

#### Development Profile

```bash
OAUTH2_SERVICE_ENABLED=false
OAUTH2_SERVICE_TO_SERVICE_ENABLED=false
OAUTH2_INTROSPECTION_ENABLED=false
```

_Disables authentication for development ease_

#### Testing Profile

```bash
OAUTH2_SERVICE_ENABLED=true
OAUTH2_SERVICE_TO_SERVICE_ENABLED=false
OAUTH2_INTROSPECTION_ENABLED=false
JWT_SECRET=test-secret
```

_Uses local JWT validation without service-to-service auth_

#### Production Profile

```bash
OAUTH2_SERVICE_ENABLED=true
OAUTH2_SERVICE_TO_SERVICE_ENABLED=true
OAUTH2_INTROSPECTION_ENABLED=true
OAUTH2_AUTH_BASE_URL=https://auth.production.com/api/v1/auth
OAUTH2_CLIENT_ID=meal-plan-production
OAUTH2_CLIENT_SECRET=secure-production-secret
```

_Full authentication with introspection enabled_

## API Usage

### Making Authenticated Requests

#### User Authentication

```bash
# Get meal plans for authenticated user
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     https://api.example.com/api/v1/meal-plans

# Create new meal plan
curl -X POST \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -H "Content-Type: application/json" \
     -d '{"name": "Weekly Plan", "startDate": "2024-03-01"}' \
     https://api.example.com/api/v1/meal-plans
```

#### Service-to-Service Authentication

```bash
# Service obtains token using client credentials
curl -X POST \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&scope=read write" \
     -u "service-client:service-secret" \
     https://auth.example.com/api/v1/auth/oauth2/token

# Service uses token for requests
curl -H "Authorization: Bearer service-access-token" \
     https://api.example.com/api/v1/meal-plans
```

### Using the Current User Decorator

In your controllers, use the `@CurrentUser()` decorator to access authenticated user information:

```typescript
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/modules/auth/interfaces/jwt-payload.interface';

@Controller('meal-plans')
export class MealPlansController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserMealPlans(@CurrentUser() user: AuthenticatedUser) {
    console.log('User ID:', user.id);
    console.log('User scopes:', user.scopes);
    // Use user information for authorization logic
  }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Missing or invalid authorization header",
  "correlationId": "req-123456",
  "timestamp": "2024-03-01T10:00:00.000Z",
  "path": "/api/v1/meal-plans"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Insufficient permissions for service access",
  "correlationId": "req-123456",
  "timestamp": "2024-03-01T10:00:00.000Z",
  "path": "/api/v1/meal-plans"
}
```

## Security Features

### Token Security

- **JWT Signature Verification**: All tokens are cryptographically verified
- **Expiration Validation**: Tokens are checked for expiration with configurable buffer
- **Issuer Validation**: Tokens must come from trusted issuer
- **Scope-Based Authorization**: Services must have appropriate scopes for operations

### Caching Security

- **Token Hashing**: Cached tokens are hashed for security
- **TTL Management**: Cached entries expire automatically
- **Memory Safety**: Cache cleanup prevents memory leaks

### Network Security

- **TLS/SSL**: All external authentication requests use HTTPS
- **Client Authentication**: Service-to-service calls use HTTP Basic auth with client credentials
- **Rate Limiting**: Built-in rate limiting prevents abuse

### Request Security

- **Correlation IDs**: All requests include unique correlation IDs for tracing
- **Structured Logging**: Security events are logged with full context
- **Error Handling**: Generic error messages prevent information leakage

## Development Guide

### Running with Authentication Disabled

For local development, you can disable authentication:

```bash
# .env.development
OAUTH2_SERVICE_ENABLED=false
OAUTH2_SERVICE_TO_SERVICE_ENABLED=false
```

### Testing Authentication

#### Unit Tests

The authentication system includes comprehensive unit tests:

```bash
npm run test -- --testPathPattern=auth
```

#### Manual Testing

Use the included test endpoints:

```bash
# Health check (no auth required)
curl http://localhost:3000/api/v1/health

# Test authenticated endpoint
curl -H "Authorization: Bearer test-token" \
     http://localhost:3000/api/v1/meal-plans
```

### Custom Authentication Logic

#### Creating Custom Guards

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';

@Injectable()
export class CustomAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Custom authentication logic
    return true;
  }
}
```

#### Extending Token Validation

```typescript
import { Injectable } from '@nestjs/common';
import { TokenValidationService } from '@/modules/auth/services/token-validation.service';

@Injectable()
export class CustomTokenValidationService extends TokenValidationService {
  async validateToken(token: string): Promise<AuthenticatedUser> {
    // Custom validation logic
    const user = await super.validateToken(token);

    // Additional validation
    return user;
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "OAuth2 authentication is disabled"

**Cause**: `OAUTH2_SERVICE_ENABLED` is set to `false` or not set
**Solution**: Set `OAUTH2_SERVICE_ENABLED=true` in your environment

#### 2. "JWT secret not configured"

**Cause**: `JWT_SECRET` environment variable is missing
**Solution**: Set `JWT_SECRET=your-secret-key` in your environment

#### 3. "Invalid token signature"

**Cause**: JWT secret doesn't match the token signing key
**Solution**: Ensure `JWT_SECRET` matches the auth service signing key

#### 4. "Service authentication failed"

**Cause**: Invalid client credentials or network issues
**Solution**:

- Verify `OAUTH2_CLIENT_ID` and `OAUTH2_CLIENT_SECRET`
- Check network connectivity to auth service
- Verify auth service is running and accessible

#### 5. "Insufficient permissions for service access"

**Cause**: Service token doesn't have required scopes
**Solution**: Ensure service is configured with `read` and/or `write` scopes

### Debugging

#### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run start:dev
```

#### Token Introspection Debugging

```bash
# Manually test token introspection
curl -X POST \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "token=your-access-token" \
     -u "client-id:client-secret" \
     https://auth.example.com/api/v1/auth/oauth2/introspect
```

#### Service Token Debugging

Use the auth service debug endpoints to check token status:

```typescript
// In your service
const tokenInfo = this.serviceAuthService.getTokenInfo();
console.log('Token info:', tokenInfo);
```

### Performance Optimization

#### Token Caching

- Adjust `tokenCacheTTL` for service tokens based on your needs
- Adjust `introspectionCacheTTL` for user token validation
- Monitor cache hit rates in logs

#### Network Optimization

- Use local JWT validation in development
- Enable introspection only in production
- Implement connection pooling for auth service requests

### Security Best Practices

1. **Rotate Secrets Regularly**: Change JWT secrets and client secrets periodically
2. **Use Strong Secrets**: Generate cryptographically secure secrets (32+ characters)
3. **Monitor Authentication**: Set up alerts for authentication failures
4. **Audit Permissions**: Regularly review service scopes and user permissions
5. **Secure Transport**: Always use HTTPS in production
6. **Log Security Events**: Monitor and alert on security-related events

For additional support or questions, refer to the main [README.md](../README.md) or check the service logs for detailed error information.
