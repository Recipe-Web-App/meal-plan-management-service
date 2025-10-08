# Support

Thank you for using the Meal Plan Management Service! This document provides resources to help you get support.

## Documentation

Before asking for help, please check our documentation:

### Primary Documentation

- **[README.md](../README.md)** - Complete feature overview, setup instructions, and API documentation
- **[CLAUDE.md](../CLAUDE.md)** - Development commands, architecture overview, and developer guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines and development workflow
- **[SECURITY.md](SECURITY.md)** - Security features, best practices, and vulnerability reporting

### Code Examples

- **[`.env.example`](../.env.example)** - Configuration examples
- **[Docker Compose](../docker-compose.yml)** - Deployment examples (if available)
- **[Database Documentation](../docs/DATABASE.md)** - Prisma setup and database management

## Getting Help

### 1. Search Existing Resources

Before creating a new issue, please search:

- [Existing Issues][issues] - Someone may have already asked
- [Closed Issues][closed-issues] - Your question may already be answered
- [Discussions][discussions] - Community Q&A

[issues]: https://github.com/Recipe-Web-App/meal-plan-management-service/issues
[closed-issues]: https://github.com/Recipe-Web-App/meal-plan-management-service/issues?q=is%3Aissue+is%3Aclosed
[discussions]: https://github.com/Recipe-Web-App/meal-plan-management-service/discussions

### 2. GitHub Discussions (Recommended for Questions)

For general questions, use [GitHub Discussions](https://github.com/Recipe-Web-App/meal-plan-management-service/discussions):

**When to use Discussions:**

- "How do I...?" questions
- Configuration help
- Best practice advice
- Integration questions
- Authentication/authorization questions
- Architecture discussions
- Troubleshooting (non-bug)
- Database/Prisma questions

**Categories:**

- **Q&A** - Ask questions and get answers
- **Ideas** - Share feature ideas and proposals
- **Show and Tell** - Share your implementations
- **General** - Everything else

### 3. GitHub Issues (For Bugs and Features)

Use [GitHub Issues](https://github.com/Recipe-Web-App/meal-plan-management-service/issues/new/choose) for:

- Bug reports
- Feature requests
- Performance issues
- Documentation problems
- Security vulnerabilities (low severity - use Security Advisories for critical)

**Issue Templates:**

- **Bug Report** - Report unexpected behavior
- **Feature Request** - Suggest new functionality
- **Performance Issue** - Report performance problems
- **Documentation** - Documentation improvements
- **Security Vulnerability** - Low-severity security issues

### 4. Security Issues

**IMPORTANT:** For security vulnerabilities, use:

- [GitHub Security Advisories](https://github.com/Recipe-Web-App/meal-plan-management-service/security/advisories/new) (private)
- See [SECURITY.md](SECURITY.md) for details

**Never report security issues publicly through issues or discussions.**

## Common Questions

### Setup and Configuration

**Q: How do I get started?**
A: See the Quick Start section in [README.md](../README.md) and [CLAUDE.md](../CLAUDE.md)

**Q: What environment variables are required?**
A: Check [`.env.example`](../.env.example) or [CLAUDE.md](../CLAUDE.md#environment-variables) for all configuration options

**Q: How do I set up the database?**
A: See [Database Setup Guide](../docs/DATABASE_SETUP.md) for complete Prisma and PostgreSQL setup instructions

**Q: Can I use a different database?**
A: This service is designed for PostgreSQL. Other databases would require Prisma schema changes.

**Q: How do I enable authentication?**
A: Configure OAuth2 settings in environment variables. See [Authentication Guide](../docs/AUTHENTICATION.md)

### Development

**Q: How do I run tests?**
A: Run `npm test` or see [CLAUDE.md](../CLAUDE.md#testing) for test commands

**Q: What's the code structure?**
A: See Architecture Overview in [CLAUDE.md](../CLAUDE.md#architecture)

**Q: How do I contribute?**
A: See [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines

**Q: How do I run database migrations?**
A: Use `npx prisma migrate dev`. See [Database Guide](../docs/DATABASE.md) for details

**Q: How do I seed the database?**
A: Run `npx prisma db seed`. See [Database Guide](../docs/DATABASE.md#seeding)

### Troubleshooting

**Q: Service fails to start?**

- Check logs: `npm run start:dev` (development) or `docker logs <container-name>`
- Verify environment variables in `.env`
- Check PostgreSQL connectivity
- Run `npx prisma generate` to ensure Prisma Client is up to date
- Review [README.md](../README.md#troubleshooting) troubleshooting section (if available)

**Q: Database connection errors?**

- Verify `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL is running
- Check database exists: `psql -U postgres -l`
- Run migrations: `npx prisma migrate dev`
- See [Database Guide](../docs/DATABASE.md#troubleshooting)

**Q: Authentication failures?**

- Verify OAuth2 configuration in environment variables
- Check JWT token validity
- Ensure auth service is accessible (`OAUTH2_AUTH_BASE_URL`)
- Review logs for authentication errors
- See [Authentication Guide](../docs/AUTHENTICATION.md)

**Q: Performance issues?**

- Check database connection pool settings
- Review Prisma query performance
- Enable query logging: `DATABASE_LOG_QUERIES=true`
- Check rate limiting configuration
- See [Performance Issue Template](.github/ISSUE_TEMPLATE/performance_issue.yml)

**Q: CORS errors?**

- Configure `CORS_ORIGINS` environment variable
- Check request Origin header
- Review Helmet and CORS middleware configuration

**Q: Swagger/API documentation not loading?**

- Access `/docs` endpoint (e.g., `http://localhost:3000/docs`)
- Ensure `NODE_ENV` is not set to `production` (Swagger disabled in prod by default)
- Check server logs for errors

### API Usage

**Q: How do I authenticate API requests?**
A: Include `Authorization: Bearer <token>` header. See [Authentication Guide](../docs/AUTHENTICATION.md)

**Q: What's the API base URL?**
A: All endpoints use `/api/v1` prefix. Full URL: `http://localhost:3000/api/v1/<endpoint>`

**Q: Where's the API documentation?**
A: Access Swagger UI at `/docs` endpoint or see [CLAUDE.md](../CLAUDE.md)

**Q: How do I create a meal plan?**
A: POST to `/api/v1/meal-plans` with appropriate payload. See Swagger docs for schema.

## Response Times

We aim to:

- Acknowledge issues/discussions within 48 hours
- Respond to questions within 1 week
- Fix critical bugs as priority
- Review PRs within 1-2 weeks

Note: This is a community project. Response times may vary.

## Commercial Support

This is an open-source project. Commercial support is not currently available.

## Community Guidelines

When asking for help:

- **Be specific** - Include exact error messages, versions, configurations
- **Provide context** - What were you trying to do? What happened instead?
- **Include details** - Environment (Node.js version, OS), deployment method, relevant logs
- **Be patient** - Maintainers and community volunteers help in their free time
- **Be respectful** - Follow the [Code of Conduct](CODE_OF_CONDUCT.md)
- **Search first** - Check if your question was already answered
- **Give back** - Help others when you can

## Bug Report Best Practices

When reporting bugs, include:

- Node.js version (`node --version`)
- npm version (`npm --version`)
- Operating system
- Deployment environment (Docker/K8s/Local/Cloud)
- Exact error messages
- Steps to reproduce
- Expected vs actual behavior
- Relevant configuration (redact secrets!)
- Logs (redact sensitive info!)
- Database version (PostgreSQL)

Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml) - it helps ensure you provide all needed information.

## Additional Resources

### NestJS Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Fundamentals](https://docs.nestjs.com/first-steps)
- [NestJS Techniques](https://docs.nestjs.com/techniques/configuration)

### Prisma Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

### OAuth2 Resources

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [OAuth2 Simplified](https://www.oauth.com/)

### TypeScript Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Node.js Resources

- [Node.js Documentation](https://nodejs.org/docs/latest/api/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Still Need Help?

If you can't find an answer:

1. Check [Discussions](https://github.com/Recipe-Web-App/meal-plan-management-service/discussions)
2. Ask a new question in [Q&A](https://github.com/Recipe-Web-App/meal-plan-management-service/discussions/new?category=q-a)
3. For bugs, create an [Issue](https://github.com/Recipe-Web-App/meal-plan-management-service/issues/new/choose)

We're here to help!
