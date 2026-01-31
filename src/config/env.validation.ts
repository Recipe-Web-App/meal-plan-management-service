import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging', 'local')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required(),
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_SCHEMA: Joi.string().default('public'),
  MEAL_PLAN_MANAGEMENT_DB_USER: Joi.string().required(),
  MEAL_PLAN_MANAGEMENT_DB_PASSWORD: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // Redis (for caching/sessions)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_DB: Joi.number().integer().min(0).max(15).default(0),
  REDIS_USER: Joi.string().optional(),
  REDIS_PASSWORD: Joi.string().optional(),

  // External APIs
  RECIPE_SERVICE_URL: Joi.string().uri().optional(),
  USER_SERVICE_URL: Joi.string().uri().optional(),

  // Rate limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),

  // CORS
  CORS_ORIGINS: Joi.string().default('*'),

  // OAuth2 Configuration
  OAUTH2_SERVICE_ENABLED: Joi.boolean().default(false),
  OAUTH2_SERVICE_TO_SERVICE_ENABLED: Joi.boolean().default(false),
  OAUTH2_INTROSPECTION_ENABLED: Joi.boolean().default(false),
  OAUTH2_CLIENT_ID: Joi.string().when('OAUTH2_SERVICE_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  OAUTH2_CLIENT_SECRET: Joi.string().when('OAUTH2_SERVICE_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
  MEAL_PLAN_SERVICE_LOGGING_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .optional(),
  LOG_CONSOLE_FORMAT: Joi.string().valid('pretty', 'json').default('pretty'),
  LOG_FILE_ENABLED: Joi.string().valid('true', 'false').optional(),
  LOG_FILE_PATH: Joi.string().default('logs'),
  LOG_FILE_MAX_SIZE: Joi.string().default('20m'),
  LOG_FILE_MAX_FILES: Joi.string().default('14d'),
  LOG_FILE_DATE_PATTERN: Joi.string().default('YYYY-MM-DD'),
});
