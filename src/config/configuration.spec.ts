import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import configuration from './configuration';

describe('Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('app configuration', () => {
    it('should use default values when environment variables are not set', () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.CORS_ORIGINS;
      delete process.env.LOG_LEVEL;

      const config = configuration();

      expect(config.app.nodeEnv).toBe('development');
      expect(config.app.port).toBe(3000);
      expect(config.app.corsOrigins).toEqual(['*']);
      expect(config.app.logLevel).toBe('info');
    });

    it('should parse CORS_ORIGINS correctly', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com';

      const config = configuration();

      expect(config.app.corsOrigins).toEqual(['http://localhost:3000', 'https://example.com']);
    });

    it('should handle invalid PORT gracefully', () => {
      process.env.PORT = 'invalid';

      const config = configuration();

      expect(config.app.port).toBe(3000);
    });
  });

  describe('database configuration', () => {
    it('should use default values for optional database settings', () => {
      delete process.env.POSTGRES_HOST;
      delete process.env.POSTGRES_PORT;
      delete process.env.DATABASE_MAX_RETRIES;
      delete process.env.DATABASE_RETRY_DELAY;
      delete process.env.DATABASE_HEALTH_CHECK_INTERVAL;

      const config = configuration();

      expect(config.database.host).toBe('localhost');
      expect(config.database.port).toBe(5432);
      expect(config.database.maxRetries).toBe(5);
      expect(config.database.retryDelay).toBe(5000);
      expect(config.database.healthCheckInterval).toBe(30000);
    });

    it('should enable query logging in development environment', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.DATABASE_LOG_QUERIES;

      const config = configuration();

      expect(config.database.logQueries).toBe(true);
    });

    it('should enable query logging when explicitly set to true', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_LOG_QUERIES = 'true';

      const config = configuration();

      expect(config.database.logQueries).toBe(true);
    });

    it('should disable query logging when set to false', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_LOG_QUERIES = 'false';

      const config = configuration();

      expect(config.database.logQueries).toBe(false);
    });

    it('should handle invalid database port gracefully', () => {
      process.env.POSTGRES_PORT = 'invalid';

      const config = configuration();

      expect(config.database.port).toBe(5432);
    });
  });

  describe('jwt configuration', () => {
    it('should use default expires in value', () => {
      delete process.env.JWT_EXPIRES_IN;

      const config = configuration();

      expect(config.jwt.expiresIn).toBe('1d');
    });

    it('should use provided expires in value', () => {
      process.env.JWT_EXPIRES_IN = '2h';

      const config = configuration();

      expect(config.jwt.expiresIn).toBe('2h');
    });
  });

  describe('redis configuration', () => {
    it('should use default values for redis settings', () => {
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;

      const config = configuration();

      expect(config.redis.host).toBe('localhost');
      expect(config.redis.port).toBe(6379);
      expect(config.redis.password).toBeUndefined();
    });

    it('should handle invalid redis port gracefully', () => {
      process.env.REDIS_PORT = 'invalid';

      const config = configuration();

      expect(config.redis.port).toBe(6379);
    });
  });

  describe('rate limit configuration', () => {
    it('should use nullish coalescing for rate limit values', () => {
      delete process.env.RATE_LIMIT_TTL;
      delete process.env.RATE_LIMIT_MAX;

      const config = configuration();

      // When env vars are undefined, parseInt returns NaN
      expect(config.rateLimit.ttl).toBeNaN();
      expect(config.rateLimit.limit).toBeNaN();
    });

    it('should handle invalid rate limit values', () => {
      process.env.RATE_LIMIT_TTL = 'invalid';
      process.env.RATE_LIMIT_MAX = 'invalid';

      const config = configuration();

      // When env vars are invalid strings, parseInt returns NaN
      expect(config.rateLimit.ttl).toBeNaN();
      expect(config.rateLimit.limit).toBeNaN();
    });

    it('should use valid rate limit values when provided', () => {
      process.env.RATE_LIMIT_TTL = '120';
      process.env.RATE_LIMIT_MAX = '200';

      const config = configuration();

      expect(config.rateLimit.ttl).toBe(120);
      expect(config.rateLimit.limit).toBe(200);
    });
  });

  describe('logging configuration', () => {
    it('should use default logging values', () => {
      delete process.env.LOG_LEVEL;
      delete process.env.MEAL_PLAN_SERVICE_LOGGING_LEVEL;
      delete process.env.LOG_CONSOLE_FORMAT;
      delete process.env.LOG_FILE_ENABLED;
      delete process.env.LOG_FILE_PATH;
      delete process.env.LOG_FILE_MAX_SIZE;
      delete process.env.LOG_FILE_MAX_FILES;
      delete process.env.LOG_FILE_DATE_PATTERN;

      const config = configuration();

      expect(config.logging.level).toBe('info');
      expect(config.logging.consoleFormat).toBe('pretty');
      expect(config.logging.fileEnabled).toBe(false);
      expect(config.logging.filePath).toBe('logs');
      expect(config.logging.fileMaxSize).toBe('20m');
      expect(config.logging.fileMaxFiles).toBe('14d');
      expect(config.logging.fileDatePattern).toBe('YYYY-MM-DD');
    });

    it('should enable file logging in production environment', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_FILE_ENABLED;

      const config = configuration();

      expect(config.logging.fileEnabled).toBe(true);
    });

    it('should prefer LOG_LEVEL over service-specific level', () => {
      process.env.LOG_LEVEL = 'debug';
      process.env.MEAL_PLAN_SERVICE_LOGGING_LEVEL = 'warn';

      const config = configuration();

      expect(config.logging.level).toBe('debug');
    });

    it('should fallback to service-specific logging level', () => {
      delete process.env.LOG_LEVEL;
      process.env.MEAL_PLAN_SERVICE_LOGGING_LEVEL = 'warn';

      const config = configuration();

      expect(config.logging.level).toBe('warn');
    });
  });

  describe('external services configuration', () => {
    it('should handle optional external service URLs', () => {
      delete process.env.RECIPE_SERVICE_URL;
      delete process.env.USER_SERVICE_URL;

      const config = configuration();

      expect(config.externalServices.recipeServiceUrl).toBeUndefined();
      expect(config.externalServices.userServiceUrl).toBeUndefined();
    });

    it('should set external service URLs when provided', () => {
      process.env.RECIPE_SERVICE_URL = 'http://recipe-service:3001';
      process.env.USER_SERVICE_URL = 'http://user-service:3002';

      const config = configuration();

      expect(config.externalServices.recipeServiceUrl).toBe('http://recipe-service:3001');
      expect(config.externalServices.userServiceUrl).toBe('http://user-service:3002');
    });
  });
});
