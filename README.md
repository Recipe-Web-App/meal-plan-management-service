[![Nest Logo](https://nestjs.com/img/logo-small.svg)](http://nestjs.com/)

A progressive [Node.js](http://nodejs.org) framework for building efficient and scalable
server-side applications.

[![NPM Version](https://img.shields.io/npm/v/@nestjs/core.svg)](https://www.npmjs.com/~nestjscore)
[![Package License](https://img.shields.io/npm/l/@nestjs/core.svg)](https://www.npmjs.com/~nestjscore)
[![NPM Downloads](https://img.shields.io/npm/dm/@nestjs/common.svg)](https://www.npmjs.com/~nestjscore)
[![CircleCI](https://img.shields.io/circleci/build/github/nestjs/nest/master)](https://circleci.com/gh/nestjs/nest)
[![Discord](https://img.shields.io/badge/discord-online-brightgreen.svg)](https://discord.gg/G7Qnnhy)
[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
[![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)
[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-ff3f59.svg)](https://paypal.me/kamilmysliwiec)
[![Support us](https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg)](https://opencollective.com/nest#sponsor)
[![Follow us on Twitter](https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow)](https://twitter.com/nestframework)

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

The **Meal Plan Management Service** is a comprehensive NestJS microservice for managing meal plans, recipes, and
nutritional tracking within the Recipe Web App ecosystem. Built with TypeScript, it provides a robust REST API with
OAuth2 authentication, PostgreSQL database integration, and comprehensive monitoring capabilities.

## Project setup

```bash
bun install
```

## Compile and run the project

```bash
# development
$ bun run start

# watch mode
$ bun run start:dev

# production mode
$ bun run start:prod
```

## Run tests

```bash
# unit tests
$ bun test

# e2e tests
$ bun test test/**/*.e2e-spec.ts

# test coverage
$ bun test --coverage
```

## Automated Dependency Management

This project uses **Renovate** to automatically keep dependencies up to date. Renovate will:

- Monitor npm dependencies and create update PRs
- Check Docker base images
- Group related dependencies for easier management
- Create well-labeled pull requests
- Prioritize security updates

For more details, see [`.github/RENOVATE.md`](.github/RENOVATE.md).

## ⚡ GitHub Actions & Workflows

This project includes a comprehensive CI/CD pipeline with automated workflows for:

- 🔍 **Security Scanning**: CodeQL, secret detection, vulnerability scanning
- 🧪 **Testing & Quality**: Automated tests, code coverage, performance testing
- 📦 **Build & Deploy**: Docker builds, semantic releases, environment deployments
- 📊 **Monitoring**: Database migrations, health checks, performance metrics
- 🤖 **Automation**: Issue management, auto-labeling, dependency updates

For complete workflow documentation, see [`.github/WORKFLOWS.md`](.github/WORKFLOWS.md).

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it
runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more
information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out
[Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment
straightforward and fast, requiring just a few simple steps:

```bash
bun add -g @nestjs/mau
mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than
managing infrastructure.

## Authentication & Security

This service implements a comprehensive OAuth2 authentication system with JWT tokens:

### 🔐 Authentication Methods

- **JWT Authentication**: OAuth2 with JWT tokens using passport-jwt
- **Service-to-Service**: Client credentials flow for microservice communication
- **Token Validation**: Supports both local JWT validation and introspection

### 🛡️ Security Features

- Bearer token authentication on all protected endpoints
- Configurable OAuth2 with multiple validation strategies
- Rate limiting with multiple tiers (short/medium/long term)
- Helmet security headers and CORS protection
- Request correlation IDs for tracing

### 📖 API Authentication

All API endpoints (except health checks) require Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.example.com/api/v1/meal-plans
```

For detailed authentication setup and configuration, see [`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md).

## API Documentation

Interactive API documentation is available at `/docs` when running the service:

- **Swagger UI**: Complete API reference with authentication
- **Try it out**: Test endpoints directly from the browser
- **OpenAPI spec**: Full specification with security definitions

## Architecture & Features

### 🏗️ Core Technologies

- **Runtime**: Bun (replaces Node.js for faster performance)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: OAuth2 + JWT with Passport.js
- **Validation**: Class-validator with DTO patterns
- **Documentation**: OpenAPI/Swagger with full schemas

### 📦 Key Modules

- **Meal Plans**: CRUD operations with advanced filtering and view modes
- **Authentication**: OAuth2 guards, strategies, and token management
- **Health Monitoring**: Database and service health endpoints
- **Database**: Prisma integration with connection pooling and retry logic

### 🎯 API Features

- RESTful endpoints with consistent response format
- Comprehensive filtering, sorting, and pagination
- Multiple view modes (full, day, week, month)
- Detailed error responses with correlation IDs
- Rate limiting with configurable tiers

## Resources

### Project Documentation

- [`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md) - Complete authentication guide
- [`docs/DATABASE.md`](./docs/DATABASE.md) - Database setup and usage
- [`docs/DATABASE_SETUP.md`](./docs/DATABASE_SETUP.md) - Step-by-step installation
- [`CLAUDE.md`](./CLAUDE.md) - Development guidelines and commands

### NestJS Resources

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy)
- Check out our official video [courses](https://courses.nestjs.com/) for hands-on experience

## License

This project is MIT licensed.
