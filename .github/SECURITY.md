# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version  | Supported          |
| -------- | ------------------ |
| latest   | :white_check_mark: |
| < latest | :x:                |

We recommend always running the latest version for security patches and updates.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### Private Reporting (Preferred)

Report security vulnerabilities using [GitHub Security Advisories](https://github.com/Recipe-Web-App/meal-plan-management-service/security/advisories/new).

This allows us to:

- Discuss the vulnerability privately
- Develop and test a fix
- Coordinate disclosure timing
- Issue a CVE if necessary

### What to Include

When reporting a vulnerability, please include:

1. **Description** - Clear description of the vulnerability
2. **Impact** - What can an attacker achieve?
3. **Reproduction Steps** - Step-by-step instructions to reproduce
4. **Affected Components** - Which parts of the service are affected
5. **Suggested Fix** - If you have ideas for remediation
6. **Environment** - Version, configuration, deployment details
7. **Proof of Concept** - Code or requests demonstrating the issue (if safe to share)

### Example Report

```text
Title: SQL Injection in Meal Plan Query

Description: The meal plan search endpoint does not properly sanitize user input...

Impact: An attacker can execute arbitrary SQL queries and access unauthorized data...

Steps to Reproduce:
1. Send GET request to /api/v1/meal-plans/search?query=' OR 1=1--
2. Observe unauthorized data in response

Affected: src/modules/meal-plans/meal-plans.service.ts line 45

Suggested Fix: Use Prisma parameterized queries instead of raw SQL

Environment: v1.0.0, Node.js 20.11.0, PostgreSQL 16
```

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies by severity (critical: days, high: weeks, medium: months)

## Severity Levels

### Critical

- Remote code execution
- Authentication/authorization bypass
- Privilege escalation to admin
- Mass data exposure
- SQL injection with data access

### High

- JWT token forgery/manipulation
- Unauthorized access to user data
- Denial of service affecting all users
- Data leakage through API endpoints
- Session hijacking

### Medium

- Information disclosure (limited)
- CSRF vulnerabilities
- Rate limiting bypass
- Insecure dependencies with known exploits
- Weak cryptographic practices

### Low

- Verbose error messages
- Security header issues
- Best practice violations
- Minor information leakage

## Security Features

This service implements multiple security layers:

### Authentication & Authorization

- **OAuth2/JWT Authentication** - Token-based authentication with service-to-service support
- **Bearer Token Validation** - All protected endpoints require valid JWT tokens
- **Scope-based Authorization** - Fine-grained permission control
- **Token Caching** - Performance optimization with configurable TTL
- **Service Authentication** - Client credentials flow for service-to-service communication

### Application Security

- **Rate Limiting** - Multi-tier throttling (short/medium/long-term limits)
- **CORS Protection** - Configurable cross-origin policies
- **Input Validation** - DTOs with class-validator for all inputs
- **SQL Injection Protection** - Prisma ORM with parameterized queries
- **Secure Headers** - Helmet middleware for security headers
- **Request Correlation** - Request tracking with correlation IDs

### API Security

- **Global Validation Pipe** - Automatic validation and transformation
- **Exception Filters** - Consistent error responses without data leakage
- **Response Interceptors** - Standardized API response format
- **Authentication Guards** - JWT and service authentication guards
- **Swagger Documentation** - API documentation with security schemes

### Data Security

- **Prisma ORM** - Safe database queries with type safety
- **Connection Pooling** - Secure database connection management
- **Transaction Management** - ACID compliant database operations
- **Schema Validation** - Joi validation for environment variables
- **Secrets Management** - Environment variables (never in code)

### Infrastructure Security

- **Health Monitoring** - Liveness/readiness probes
- **Audit Logging** - Winston structured logging with correlation IDs
- **Database Health Checks** - Automatic reconnection and retry logic
- **TLS Support** - HTTPS with configurable certificates
- **Docker Security** - Non-root user, minimal base images

## Security Best Practices

### For Operators

1. **Use TLS/HTTPS** - Always encrypt traffic in production
2. **Secure Environment Variables** - Use secrets management (Kubernetes secrets, AWS Secrets Manager, etc.)
3. **Monitor Logs** - Watch for suspicious patterns and authentication failures
4. **Update Dependencies** - Keep npm packages current, review Dependabot PRs
5. **Limit Exposure** - Use network policies and firewalls
6. **Configure CORS** - Whitelist only trusted origins
7. **Set Rate Limits** - Protect against brute force and DoS attacks
8. **Database Security** - Use connection encryption and least privilege
9. **Backup Regularly** - Maintain secure, encrypted backups
10. **Enable OAuth2** - Use proper authentication service integration

### For Developers

1. **Never Commit Secrets** - Use `.env` (gitignored), run security scans
2. **Validate Inputs** - Use DTOs with class-validator decorators
3. **Use Prisma Queries** - Never use raw SQL without parameterization
4. **Handle Errors Securely** - Don't leak sensitive info in error messages
5. **Run Security Checks** - Use `npm run security:secrets` and `npm audit`
6. **Review Dependencies** - Check for known vulnerabilities regularly
7. **Follow NestJS Security** - Use guards, interceptors, and pipes properly
8. **Test Security** - Include security test cases
9. **Document Security** - Note security implications in PRs
10. **Update Swagger** - Keep API documentation current

## Security Checklist

Before deploying:

- [ ] TLS/HTTPS configured
- [ ] OAuth2 authentication configured and tested
- [ ] JWT tokens validated properly
- [ ] Rate limiting configured for all endpoints
- [ ] CORS whitelist configured
- [ ] Secrets in environment variables (not code)
- [ ] Database encryption at rest and in transit
- [ ] Database connection pooling configured
- [ ] Security headers enabled (Helmet)
- [ ] Audit logging enabled (Winston)
- [ ] Input validation on all DTOs
- [ ] Dependencies updated (`npm audit` passing)
- [ ] Security scan passed (`npm run security:secrets`)
- [ ] Network policies applied
- [ ] Monitoring and alerting configured
- [ ] Health check endpoints working
- [ ] Swagger documentation includes security schemes

## Known Security Considerations

### Authentication System

- Access tokens are JWTs with configurable expiration
- Token validation supports both local JWT validation and remote introspection
- Token caching with TTL for performance
- Service-to-service authentication via client credentials flow
- Configurable for different deployment environments

### Database Security

- PostgreSQL connections use Prisma connection pooling
- Credentials via environment variables only
- TLS for database connections in production
- Prepared statements prevent SQL injection (Prisma default)
- Multi-schema support with proper isolation
- Automatic retry logic with connection health monitoring

### API Protection

- Global validation pipe with whitelist and transformation
- Exception filters prevent stack trace leakage
- Response interceptors standardize output format
- Correlation IDs for request tracing
- Rate limiting with multiple tiers

### Input Validation

- All DTOs use class-validator decorators
- Automatic transformation and sanitization
- Whitelist mode removes unknown properties
- Type safety with TypeScript strict mode

## Disclosure Policy

We follow **coordinated disclosure**:

1. Vulnerability reported privately via GitHub Security Advisories
2. We confirm and develop fix
3. Fix tested and released
4. Public disclosure after fix is deployed (typically 90 days)
5. Credit given to reporter (if desired)

## Security Updates

Subscribe to:

- [GitHub Security Advisories](https://github.com/Recipe-Web-App/meal-plan-management-service/security/advisories)
- [Release Notes](https://github.com/Recipe-Web-App/meal-plan-management-service/releases)
- Watch repository for security patches

## Dependency Security

We use:

- **Dependabot** - Automated dependency updates
- **npm audit** - Vulnerability scanning in CI/CD
- **GitHub Security** - Automated security alerts
- **Regular Reviews** - Manual dependency audits

## Contact

**For security concerns**: Use [GitHub Security Advisories](https://github.com/Recipe-Web-App/meal-plan-management-service/security/advisories/new)

**For general questions**: See [SUPPORT.md](SUPPORT.md)

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged (with
permission) in:

- Security advisories
- Release notes
- This document

Thank you for helping keep the Meal Plan Management Service secure!
