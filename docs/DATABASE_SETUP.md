# Database Setup Guide

Step-by-step guide for setting up the database from scratch.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ installed
- Git repository cloned
- Terminal access

## Step 1: PostgreSQL Setup

### Install PostgreSQL (if not already installed)

#### macOS (using Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows

Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### Create Database and User

1. **Access PostgreSQL as superuser:**

   ```bash
   sudo -u postgres psql
   ```

2. **Create database user:**

   ```sql
   CREATE USER meal_plan_user WITH PASSWORD 'secure_password_123';
   ```

3. **Create database:**

   ```sql
   CREATE DATABASE meal_plan_management OWNER meal_plan_user;
   ```

4. **Grant privileges:**

   ```sql
   GRANT ALL PRIVILEGES ON DATABASE meal_plan_management TO meal_plan_user;
   ```

5. **Create schema (if using multi-schema setup):**

   ```sql
   \c meal_plan_management
   CREATE SCHEMA IF NOT EXISTS recipe_manager;
   GRANT ALL ON SCHEMA recipe_manager TO meal_plan_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA recipe_manager TO meal_plan_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA recipe_manager TO meal_plan_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA recipe_manager GRANT ALL ON TABLES TO meal_plan_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA recipe_manager GRANT ALL ON SEQUENCES TO meal_plan_user;
   ```

6. **Exit PostgreSQL:**
   ```sql
   \q
   ```

### Test Database Connection

```bash
psql -h localhost -p 5432 -U meal_plan_user -d meal_plan_management -c "SELECT version();"
```

## Step 2: Project Setup

### Install Project Dependencies

```bash
cd meal-plan-management-service
npm install
```

### Environment Configuration

1. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file:**

   ```env
   # Database Configuration
   DATABASE_URL="postgresql://meal_plan_user:secure_password_123@localhost:5432/meal_plan_management"
   POSTGRES_HOST="localhost"
   POSTGRES_PORT="5432"
   POSTGRES_DB="meal_plan_management"
   MEAL_PLAN_MANAGEMENT_DB_USER="meal_plan_user"
   MEAL_PLAN_MANAGEMENT_DB_PASSWORD="secure_password_123"

   # Database Behavior
   DATABASE_MAX_RETRIES="5"
   DATABASE_RETRY_DELAY="5000"
   DATABASE_HEALTH_CHECK_INTERVAL="30000"
   DATABASE_LOG_QUERIES="true"

   # Application Settings
   NODE_ENV="development"
   PORT="3000"
   LOG_LEVEL="info"

   # Security (generate secure values for production)
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_EXPIRES_IN="1d"
   ```

### Prisma Setup

1. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

2. **Push schema to database:**

   ```bash
   npx prisma db push
   ```

3. **Verify schema creation:**
   ```bash
   npx prisma studio
   ```
   Open http://localhost:5555 to view database tables

## Step 3: Verify Installation

### Run Application

```bash
npm run start:dev
```

The application should start without database connection errors.

### Test Database Health

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "message": "Database connection is healthy",
      "latency": 25,
      "connected": true,
      "connectionRetries": 0
    }
  }
}
```

### Run Tests

```bash
npm run test
```

All database-related tests should pass.

## Step 4: Development Data (Optional)

### Seed Development Data

Create a simple seeding script or use the built-in seeder:

```bash
# If you have a seeding script
npm run db:seed

# Or create a one-time seeder
node -e "
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
(async () => {
  const app = await NestFactory.create(AppModule);
  const seeder = app.get('DatabaseSeeder');
  const result = await seeder.seedAll({
    users: 5,
    recipes: 20,
    mealPlans: 3,
    recipesPerPlan: 10,
    cleanFirst: true
  });
  console.log('Seeded:', result);
  await app.close();
})();
"
```

### Verify Seeded Data

```bash
npx prisma studio
```

You should see users, recipes, and meal plans in the database.

## Production Setup

### Environment Variables

For production, ensure these environment variables are properly set:

```env
# Production Database
DATABASE_URL="postgresql://prod_user:secure_prod_password@prod-db-host:5432/meal_plan_prod?sslmode=require"

# Production Settings
NODE_ENV="production"
DATABASE_LOG_QUERIES="false"
DATABASE_HEALTH_CHECK_INTERVAL="60000"
LOG_LEVEL="warn"

# Security
JWT_SECRET="very-secure-production-secret-key-at-least-32-chars"
JWT_EXPIRES_IN="24h"
```

### Database Migration

For production deployments:

```bash
# Deploy migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### SSL Configuration

For production databases with SSL:

```env
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require&sslcert=client-cert.pem&sslkey=client-key.pem&sslrootcert=ca-cert.pem"
```

## Troubleshooting

### Common Issues

#### Connection Refused

**Error:** `ECONNREFUSED` or `Connection refused`

**Solutions:**

1. Check if PostgreSQL is running:

   ```bash
   sudo systemctl status postgresql  # Linux
   brew services list | grep postgresql  # macOS
   ```

2. Verify port and host settings in `.env`

3. Check PostgreSQL configuration:
   ```bash
   sudo -u postgres psql -c "SHOW port;"
   sudo -u postgres psql -c "SHOW listen_addresses;"
   ```

#### Authentication Failed

**Error:** `password authentication failed`

**Solutions:**

1. Verify username and password in `.env`
2. Check PostgreSQL user exists:
   ```sql
   sudo -u postgres psql -c "\du"
   ```
3. Reset user password:
   ```sql
   sudo -u postgres psql -c "ALTER USER meal_plan_user WITH PASSWORD 'new_password';"
   ```

#### Database Does Not Exist

**Error:** `database "meal_plan_management" does not exist`

**Solution:**

```sql
sudo -u postgres psql -c "CREATE DATABASE meal_plan_management OWNER meal_plan_user;"
```

#### Schema Issues

**Error:** `schema "recipe_manager" does not exist`

**Solution:**

```bash
# Connect to database
psql -h localhost -p 5432 -U meal_plan_user -d meal_plan_management

# Create schema
CREATE SCHEMA IF NOT EXISTS recipe_manager;
GRANT ALL ON SCHEMA recipe_manager TO meal_plan_user;
```

#### Permission Issues

**Error:** `permission denied for schema`

**Solution:**

```sql
# Grant schema permissions
GRANT ALL ON SCHEMA recipe_manager TO meal_plan_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA recipe_manager TO meal_plan_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA recipe_manager TO meal_plan_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA recipe_manager GRANT ALL ON TABLES TO meal_plan_user;
```

### Performance Issues

#### Slow Queries

1. **Enable query logging:**

   ```env
   DATABASE_LOG_QUERIES="true"
   ```

2. **Check slow query log in PostgreSQL:**
   ```sql
   -- Enable slow query logging
   ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1 second
   SELECT pg_reload_conf();
   ```

#### Connection Pool Exhaustion

1. **Adjust connection settings in DATABASE_URL:**

   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10"
   ```

2. **Monitor connections:**
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE datname = 'meal_plan_management';
   ```

### Monitoring

#### Database Size

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'recipe_manager'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Connection Status

```sql
SELECT
    datname,
    usename,
    client_addr,
    state,
    query_start
FROM pg_stat_activity
WHERE datname = 'meal_plan_management';
```

## Backup and Recovery

### Backup Database

```bash
# Full backup
pg_dump -h localhost -p 5432 -U meal_plan_user -d meal_plan_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only
pg_dump -h localhost -p 5432 -U meal_plan_user -d meal_plan_management --schema-only > schema_backup.sql

# Data only
pg_dump -h localhost -p 5432 -U meal_plan_user -d meal_plan_management --data-only > data_backup.sql
```

### Restore Database

```bash
# Restore from backup
psql -h localhost -p 5432 -U meal_plan_user -d meal_plan_management < backup_file.sql

# Or using pg_restore for custom format
pg_restore -h localhost -p 5432 -U meal_plan_user -d meal_plan_management backup_file.custom
```

## Security Checklist

- [ ] Database user has minimal required permissions
- [ ] Strong passwords for database users
- [ ] SSL/TLS encryption enabled for production
- [ ] Database firewall configured
- [ ] Regular security updates applied
- [ ] Database logs monitored
- [ ] Backup encryption enabled
- [ ] Connection string secrets properly managed
- [ ] Database access auditing enabled
- [ ] Regular vulnerability assessments performed

## Next Steps

1. **Review the [Database Documentation](./DATABASE.md)** for detailed usage patterns
2. **Check the [Quick Reference Guide](./DATABASE_QUICK_REFERENCE.md)** for common operations
3. **Run the test suite** to ensure everything is working correctly
4. **Set up monitoring** for production environments
5. **Configure backup strategies** based on your requirements
