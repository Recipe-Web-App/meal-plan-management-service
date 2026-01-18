export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  maxRetries: number;
  retryDelay: number;
  longRetryDelay: number;
  enableContinuousRetry: boolean;
  healthCheckInterval: number;
  logQueries: boolean;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  db: number;
  user?: string;
  password?: string;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  logLevel: string;
}

export interface LoggingConfig {
  level: string;
  consoleFormat: 'pretty' | 'json';
  fileEnabled: boolean;
  filePath: string;
  fileMaxSize: string;
  fileMaxFiles: string;
  fileDatePattern: string;
}

export interface RateLimitConfig {
  ttl: number;
  limit: number;
}

export interface ExternalServicesConfig {
  recipeServiceUrl?: string;
  userServiceUrl?: string;
}

export interface OAuth2Config {
  enabled: boolean;
  serviceToServiceEnabled: boolean;
  introspectionEnabled: boolean;
  clientId: string;
  clientSecret: string;
  introspectionCacheTTL: number;
}

export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT!, 10) || 3000,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['*'],
    logLevel: process.env.LOG_LEVEL ?? 'info',
  } as AppConfig,

  database: {
    url: process.env.DATABASE_URL!,
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT!, 10) || 5432,
    database: process.env.POSTGRES_DB!,
    username: process.env.MEAL_PLAN_MANAGEMENT_DB_USER!,
    password: process.env.MEAL_PLAN_MANAGEMENT_DB_PASSWORD!,
    maxRetries: parseInt(process.env.DATABASE_MAX_RETRIES!, 10) || 5,
    retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY!, 10) || 5000,
    longRetryDelay: parseInt(process.env.DATABASE_LONG_RETRY_DELAY!, 10) || 60000,
    enableContinuousRetry: process.env.DATABASE_ENABLE_CONTINUOUS_RETRY !== 'false',
    healthCheckInterval: parseInt(process.env.DATABASE_HEALTH_CHECK_INTERVAL!, 10) || 30000,
    logQueries:
      process.env.DATABASE_LOG_QUERIES === 'true' || process.env.NODE_ENV === 'development',
  } as DatabaseConfig,

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  } as JwtConfig,

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT!, 10) || 6379,
    db: parseInt(process.env.REDIS_DB!, 10) || 0,
    user: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
  } as RedisConfig,

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL!, 10) ?? 60,
    limit: parseInt(process.env.RATE_LIMIT_MAX!, 10) ?? 100,
  } as RateLimitConfig,

  logging: {
    level: process.env.LOG_LEVEL ?? process.env.MEAL_PLAN_SERVICE_LOGGING_LEVEL ?? 'info',
    consoleFormat: (process.env.LOG_CONSOLE_FORMAT ?? 'pretty') as 'pretty' | 'json',
    fileEnabled: process.env.LOG_FILE_ENABLED === 'true' || process.env.NODE_ENV === 'production',
    filePath: process.env.LOG_FILE_PATH ?? 'logs',
    fileMaxSize: process.env.LOG_FILE_MAX_SIZE ?? '20m',
    fileMaxFiles: process.env.LOG_FILE_MAX_FILES ?? '14d',
    fileDatePattern: process.env.LOG_FILE_DATE_PATTERN ?? 'YYYY-MM-DD',
  } as LoggingConfig,

  externalServices: {
    recipeServiceUrl: process.env.RECIPE_SERVICE_URL,
    userServiceUrl: process.env.USER_SERVICE_URL,
  } as ExternalServicesConfig,

  oauth2: {
    enabled: process.env.OAUTH2_SERVICE_ENABLED === 'true',
    serviceToServiceEnabled: process.env.OAUTH2_SERVICE_TO_SERVICE_ENABLED === 'true',
    introspectionEnabled: process.env.OAUTH2_INTROSPECTION_ENABLED === 'true',
    clientId: process.env.OAUTH2_CLIENT_ID!,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET!,
    introspectionCacheTTL: parseInt(process.env.OAUTH2_INTROSPECTION_CACHE_TTL!, 10) || 60000,
  } as OAuth2Config,
});
