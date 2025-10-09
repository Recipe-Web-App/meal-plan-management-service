# Contributing to Meal Plan Management Service

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing
to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Security](#security)
- [Questions](#questions)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report
unacceptable behavior through the project's issue tracker or see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/meal-plan-management-service.git
   cd meal-plan-management-service
   ```

3. **Add upstream remote**:

   ```bash
   git remote add upstream https://github.com/Recipe-Web-App/meal-plan-management-service.git
   ```

## Development Setup

### Prerequisites

- Node.js 20+ (LTS version recommended)
- npm or pnpm
- PostgreSQL 14+ (for local development)
- Docker and Docker Compose (recommended)
- Git

### Initial Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

3. **Set up database**:

   ```bash
   # Using Docker (recommended)
   docker-compose up -d postgres

   # Run Prisma migrations
   npx prisma migrate dev

   # Seed database (optional)
   npx prisma db seed
   ```

4. **Generate Prisma Client**:

   ```bash
   npx prisma generate
   ```

5. **Run the service**:

   ```bash
   npm run start:dev  # Development mode with watch
   # OR
   npm run start      # Production mode
   ```

## Development Workflow

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines

3. **Run tests frequently**:

   ```bash
   npm test
   ```

4. **Commit your changes** following commit guidelines

5. **Keep your branch updated**:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

## Testing

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test

# End-to-end tests
npm run test:e2e

# With coverage
npm run test:cov

# Watch mode
npm run test:watch

# Debug mode
npm run test:debug
```

### Writing Tests

- Write unit tests for all new functionality
- Use NestJS testing utilities (`@nestjs/testing`)
- Integration tests for database interactions and API endpoints
- Aim for >80% code coverage (enforced by CI)
- Test edge cases and error conditions
- Use descriptive test names

### Test Guidelines

- Use Jest's `describe` and `it` blocks
- Use descriptive test names: `should return meal plan when valid ID provided`
- Mock external dependencies and services
- Clean up resources in `afterEach` or `afterAll`
- Test both success and failure scenarios

## Code Style

### TypeScript/NestJS Standards

```bash
# Format code
npm run format

# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Build project (type checking)
npm run build
```

### Style Guidelines

- Follow NestJS conventions and best practices
- Use meaningful variable and function names
- Keep functions small and focused
- Use TypeScript strict mode
- Document complex logic with comments
- Use dependency injection
- Follow SOLID principles
- Use DTOs for request/response validation
- Use guards for authentication/authorization
- Use interceptors for cross-cutting concerns

### Project Structure

```text
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── config/                 # Configuration management
├── modules/
│   ├── meal-plans/         # Meal plan domain
│   ├── auth/               # Authentication
│   └── health/             # Health checks
├── shared/                 # Shared utilities
│   ├── filters/            # Exception filters
│   ├── interceptors/       # Response interceptors
│   ├── guards/             # Authorization guards
│   └── decorators/         # Custom decorators
└── utils/                  # Helper functions
```

## Commit Guidelines

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes
- `security`: Security fixes
- `deps`: Dependency updates

### Scopes

Common scopes for this project:

- `meal-plans`: Meal plan module
- `auth`: Authentication module
- `database`: Database/Prisma related
- `config`: Configuration changes
- `api`: API endpoints
- `dto`: Data transfer objects
- `tests`: Test-related changes

### Examples

```text
feat(meal-plans): add ability to duplicate meal plans

Implements functionality to create a copy of an existing meal plan
with all associated recipes and settings.

Closes #123
```

```text
fix(auth): prevent race condition in JWT token validation

Added proper request-level caching to avoid concurrent validation
of the same token.

Fixes #456
```

## Pull Request Process

### Before Submitting

1. **Run all checks**:

   ```bash
   npm run lint
   npm run format
   npm run build
   npm test
   npm run test:e2e
   npm run test:cov
   ```

2. **Update documentation** if needed:
   - README.md
   - CLAUDE.md
   - API documentation (Swagger)
   - Code comments
   - Database schema documentation

3. **Ensure no secrets** are committed:
   - Check for API keys, tokens, passwords
   - Review `.env` files (should not be committed)
   - Use `.gitignore` appropriately
   - Run `npm run security:secrets` if available

### PR Requirements

- [ ] Clear description of changes
- [ ] Related issue linked
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All CI checks passing
- [ ] No merge conflicts
- [ ] Commits follow convention
- [ ] No sensitive data committed
- [ ] Code coverage maintained (>80%)
- [ ] Swagger documentation updated (if API changes)

### PR Template

The project uses a PR template. Fill it out completely:

- Description of changes
- Type of change
- Security implications
- Breaking changes
- Testing performed
- Configuration changes
- Database migrations (if applicable)
- Performance impact

### Review Process

1. Maintainers will review your PR
2. Address feedback and requested changes
3. Keep PR updated with main branch
4. Once approved, maintainer will merge
5. PRs are typically squash-merged to main

### CI/CD Pipeline

PRs must pass:

- TypeScript compilation (`npm run build`)
- Unit tests (`npm test`)
- E2E tests (`npm run test:e2e`)
- Code coverage threshold (80%)
- Linting (`npm run lint`)
- Security scanning
- Dependency vulnerability checks

## Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Use [GitHub Security Advisories][security-advisories] to report security issues privately.

[security-advisories]: https://github.com/Recipe-Web-App/meal-plan-management-service/security/advisories/new

See [SECURITY.md](SECURITY.md) for detailed security reporting guidelines.

### Security Guidelines

- Never commit secrets or credentials
- Use environment variables for sensitive configuration
- Validate all inputs with DTOs and class-validator
- Use parameterized queries (Prisma handles this)
- Implement proper authentication and authorization
- Follow OAuth2 security best practices
- Enable rate limiting for API endpoints
- Use CORS properly
- Keep dependencies up to date

## Database Changes

### Prisma Migrations

When making database schema changes:

1. **Edit Prisma schema** (`prisma/schema.prisma`)
2. **Create migration**:

   ```bash
   npx prisma migrate dev --name describe_your_changes
   ```

3. **Test migration** locally
4. **Include migration** in your PR
5. **Update documentation** if schema changes affect API

### Migration Guidelines

- Test migrations on a copy of production data
- Write reversible migrations when possible
- Include migration in PR description
- Document breaking schema changes
- Update seed data if needed

## Questions?

- Check the [README](../README.md)
- Review the [CLAUDE.md](../CLAUDE.md) development guide
- Review existing [issues](https://github.com/Recipe-Web-App/meal-plan-management-service/issues)
- Start a [discussion](https://github.com/Recipe-Web-App/meal-plan-management-service/discussions)
- See [SUPPORT.md](SUPPORT.md) for help resources

Thank you for contributing to the Meal Plan Management Service!
