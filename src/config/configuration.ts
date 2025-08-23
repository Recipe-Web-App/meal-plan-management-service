export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  logLevel: string;
}

export interface RateLimitConfig {
  ttl: number;
  limit: number;
}

export interface ExternalServicesConfig {
  recipeServiceUrl?: string;
  userServiceUrl?: string;
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
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT!, 10) || 5432,
    database: process.env.DATABASE_NAME!,
    username: process.env.DATABASE_USERNAME!,
    password: process.env.DATABASE_PASSWORD!,
  } as DatabaseConfig,

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  } as JwtConfig,

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT!, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  } as RedisConfig,

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL!, 10) ?? 60,
    limit: parseInt(process.env.RATE_LIMIT_MAX!, 10) ?? 100,
  } as RateLimitConfig,

  externalServices: {
    recipeServiceUrl: process.env.RECIPE_SERVICE_URL,
    userServiceUrl: process.env.USER_SERVICE_URL,
  } as ExternalServicesConfig,
});
