# Meal Plan Management API - Postman Collection

This directory contains Postman collection and environment files for comprehensive API testing of the Meal Plan Management Service.

## Files Overview

### Collection Files

- **`Meal-Plan-Management-API.postman_collection.json`** - Complete collection with all endpoints organized by category:
  - Authentication flows
  - Meal plan CRUD operations
  - Meal management within plans
  - Health and monitoring endpoints
  - System information and configuration
  - Metrics and Prometheus integration
  - API documentation endpoints

### Environment Files

- **`Meal-Plan-Management-Development.postman_environment.json`** - Development environment variables (passwords as placeholders)
- **`Meal-Plan-Management-Local.postman_environment.json`** - Local development environment variables (passwords as placeholders)
- **`*-Private.postman_environment.json`** - Local-only files with real passwords (gitignored)

### Setup Instructions

#### 1. Import Collections and Environments

1. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `Meal-Plan-Management-API.postman_collection.json`
   - Collection will appear in your workspace

2. **Import Environment Templates:**
   - Import both environment files:
     - `Meal-Plan-Management-Development.postman_environment.json`
     - `Meal-Plan-Management-Local.postman_environment.json`

#### 2. Set Up Private Environment with Passwords

The environment files in Git have placeholder values for passwords. To use them locally:

1. **Create Private Environment Files:**

   ```bash
   # Copy the environment files and add '-Private' suffix
   cp Meal-Plan-Management-Development.postman_environment.json \
      Meal-Plan-Management-Development-Private.postman_environment.json
   cp Meal-Plan-Management-Local.postman_environment.json \
      Meal-Plan-Management-Local-Private.postman_environment.json
   ```

2. **Add Real Passwords:**
   Edit your `-Private` files and replace these placeholder values:
   - `REPLACE_WITH_YOUR_TEST_USER_PASSWORD` → Your actual test user password
   - `REPLACE_WITH_YOUR_ADMIN_USER_PASSWORD` → Your actual admin user password

3. **Import Private Environments:**
   - Import your `-Private.postman_environment.json` files into Postman
   - Use these private environments for actual testing
   - The `-Private` files are automatically gitignored

4. **Select Environment:**
   - Choose the appropriate private environment from the dropdown in Postman's top-right corner

## Collection Structure

### 1. Authentication

Complete authentication flow for user login and token management:

- **Login User** - Authenticates user and extracts access token for subsequent requests

### 2. Meal Plans

Core meal plan CRUD operations with comprehensive testing:

- **Create Meal Plan** - Creates new meal plan with validation and ID extraction
- **Get All Meal Plans** - Retrieves paginated meal plans with metadata validation
- **Get Meal Plan by ID** - Retrieves specific meal plan with field validation
- **Get Meal Plan with View Mode** - Advanced meal plan queries with view modes (day/week/month)
- **Update Meal Plan** - Updates existing meal plan with validation
- **Delete Meal Plan** - Deletes meal plan with success confirmation

### 3. Meal Management

Operations for managing individual meals within meal plans:

- **Add Meal to Plan** - Adds recipe as meal to meal plan with specific day/meal type
- **Remove Specific Meal** - Removes specific meal by recipe ID, date, and meal type
- **Clear All Meals from Plan** - Removes all meals from a meal plan

### 4. Health & Monitoring

Kubernetes-compatible health check endpoints:

- **Health Check** - Comprehensive service health status
- **Readiness Probe** - Kubernetes readiness check
- **Liveness Probe** - Kubernetes liveness check
- **Version Info** - Service version and build information

### 5. System Information

Service information and configuration endpoints:

- **Service Info** - Runtime service information (uptime, memory, platform details)
- **Safe Configuration** - Non-sensitive configuration values for debugging

### 6. Metrics & Monitoring

Prometheus metrics integration:

- **Prometheus Metrics** - Application metrics in Prometheus format for monitoring systems

### 7. API Documentation

OpenAPI documentation endpoints:

- **Swagger UI** - Interactive API documentation interface
- **OpenAPI JSON** - Raw OpenAPI specification in JSON format

## Environment Variables

### Base URLs

- **`mealPlanServiceAuthBaseUrl`** - Authentication service base URL
- **`mealPlanServiceBaseUrl`** - Meal Plan Management service base URL

### User Credentials (General User)

- **`mealPlanServiceTestUserUsername`** - Test user username
- **`mealPlanServiceTestUserEmail`** - Test user email
- **`mealPlanServiceTestUserFullName`** - Test user full name
- **`mealPlanServiceTestUserBio`** - Test user bio
- **`mealPlanServiceTestUserPassword`** - Test user password (secret type)

### User Credentials (Admin User)

- **`mealPlanServiceAdminUserUsername`** - Admin user username
- **`mealPlanServiceAdminUserEmail`** - Admin user email
- **`mealPlanServiceAdminUserFullName`** - Admin user full name
- **`mealPlanServiceAdminUserBio`** - Admin user bio
- **`mealPlanServiceAdminUserPassword`** - Admin user password (secret type)

### Authentication Tokens (Auto-managed)

These variables are automatically set by test scripts:

#### General User Tokens

- **`mealPlanServiceAccessToken`** - Current access token (secret type)
- **`mealPlanServiceRefreshToken`** - Current refresh token (secret type)
- **`mealPlanServiceUserId`** - Current user ID
- **`mealPlanServiceUsername`** - Current username
- **`mealPlanServiceUserEmail`** - Current user email

#### Admin User Tokens

- **`mealPlanServiceAdminAccessToken`** - Admin access token (secret type)
- **`mealPlanServiceAdminRefreshToken`** - Admin refresh token (secret type)
- **`mealPlanServiceAdminUserId`** - Admin user ID
- **`mealPlanServiceAdminUsername`** - Admin username
- **`mealPlanServiceAdminUserEmail`** - Admin user email

### Test Data Variables

- **`mealPlanServiceCreatedMealPlanId`** - Dynamically set meal plan ID from create operations
- **`mealPlanServiceCreatedMealId`** - Dynamically set meal ID from create operations

## Automatic Response Field Extraction

The collection includes robust test scripts that automatically extract important response fields and store them as environment variables for use in subsequent requests:

### Authentication Flow

- Login requests automatically extract and store access tokens, refresh tokens, and user details
- Tokens are automatically used in subsequent authenticated requests

### Meal Plan Management

- Create Meal Plan requests extract the new meal plan ID for use in subsequent operations
- All requests include comprehensive status code validation and response structure validation

## Environment Switching

**Development Environment:**

- Auth Service: `http://user-management.local/api/v1/user-management/auth`
- Meal Plan Service: `http://meal-plan-management.local/api/v1`

**Local Environment:**

- Auth Service: `http://localhost:8080/api/v1/user-management/auth`
- Meal Plan Service: `http://localhost:3000/api/v1`

Switch between environments using the environment selector dropdown in Postman's top-right corner.

## Security Features

- **Password Protection**: Sensitive passwords are excluded from Git repository
- **Private Environment Pattern**: Use local `-Private` files for credentials (automatically gitignored)
- **Secret Variables**: Passwords and tokens are marked as secret type in Postman
- **Automatic Token Management**: Access tokens are automatically managed through test scripts
- **Environment Isolation**: Separate environments prevent accidental cross-environment requests

### Security Model

- **Git Repository**: Contains collections and environment templates with placeholder passwords
- **Local Development**: Uses private environment files with real credentials
- **Team Collaboration**: Secure sharing of API structure without exposing credentials

## Usage Workflow

### Getting Started

1. Import collection file and environment templates
2. Set up private environment files with real passwords (see setup instructions above)
3. Select appropriate private environment (Development-Private or Local-Private)
4. Start with Authentication collection to establish user session
5. Use meal plan operations for core functionality testing
6. Tokens are automatically managed - no manual intervention needed

### Typical Testing Flow

1. **Authenticate** - Use Authentication requests for user login
2. **Test Core Operations** - Use Meal Plans collection for CRUD operations
3. **Test Meal Management** - Use Meal Management collection for adding/removing meals
4. **Monitor Health** - Use Health & Monitoring collection for operational checks
5. **System Inspection** - Use System Information for runtime details
6. **Monitor Metrics** - Use Metrics & Monitoring for Prometheus data
7. **Documentation** - Use API Documentation for OpenAPI specs

## Test Script Features

All requests include comprehensive test scripts that:

- Validate HTTP status codes
- Check response structure and required fields
- Extract and store important response data as environment variables
- Provide clear test result feedback
- Enable request chaining through automatic variable management

## API Coverage

This collection provides complete coverage of the Meal Plan Management Service API including:

### Core Functionality

- Complete meal plan lifecycle (create, read, update, delete)
- Advanced meal plan querying with view modes
- Meal management within plans (add, remove, clear)
- Pagination and filtering support

### Operational Features

- Health checks and monitoring
- Prometheus metrics integration
- Service information and configuration
- API documentation access

### Security & Authentication

- JWT bearer token authentication
- Automatic token extraction and management
- Service-specific authentication flow

This collection provides a foundation for comprehensive API testing with automatic token management, response validation, and seamless request chaining for the Meal Plan Management Service.
