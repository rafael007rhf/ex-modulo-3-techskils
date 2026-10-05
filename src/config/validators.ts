import envSchema from 'env-schema';
import Joi from 'joi';
import type { AppEnvironment, LogLevel } from './types';

export interface ValidatedEnvironment {
  NODE_ENV: AppEnvironment;
  PORT: number;
  DB_HOST: string;
  DB_PASSWORD?: string;
  API_KEY: string;
  PAYMENT_URL: string;
  LOG_PATH?: string;
  LOG_LEVEL?: LogLevel;
}

function invalidKeys(error: Joi.ValidationError): string[] {
  return Array.from(
    new Set(
      error.details.map((detail) => {
        const key = detail.path[0];
        return typeof key === 'string' ? key : 'configuração';
      }),
    ),
  );
}

export function validateWithJoi(
  source: NodeJS.ProcessEnv,
  selectedEnvironment: AppEnvironment,
): ValidatedEnvironment {
  const schema = Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production')
      .default(selectedEnvironment),
    PORT: Joi.number().integer().min(1).max(65535).default(3000),
    DB_HOST: Joi.string().trim().min(1).required(),
    DB_PASSWORD: Joi.string().allow('').optional(),
    API_KEY: Joi.string().trim().min(1).required(),
    PAYMENT_URL: Joi.string().uri().required(),
    LOG_PATH: Joi.string().trim().min(1).optional(),
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').optional(),
  }).unknown(true);

  const { value, error } = schema.validate(source, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    const keys = invalidKeys(error);
    throw new Error('Configuração inválida. Verifique: ' + keys.join(', '));
  }

  return {
    NODE_ENV: value.NODE_ENV,
    PORT: value.PORT,
    DB_HOST: value.DB_HOST,
    DB_PASSWORD: value.DB_PASSWORD || undefined,
    API_KEY: value.API_KEY,
    PAYMENT_URL: value.PAYMENT_URL,
    LOG_PATH: value.LOG_PATH,
    LOG_LEVEL: value.LOG_LEVEL,
  };
}

const jsonSchema = {
  type: 'object',
  required: ['DB_HOST', 'API_KEY', 'PAYMENT_URL'],
  additionalProperties: true,
  properties: {
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production'],
      default: 'development',
    },
    PORT: {
      type: 'integer',
      minimum: 1,
      maximum: 65535,
      default: 3000,
    },
    DB_HOST: { type: 'string', minLength: 1 },
    DB_PASSWORD: { type: 'string' },
    API_KEY: { type: 'string', minLength: 1 },
    PAYMENT_URL: { type: 'string', minLength: 1 },
    LOG_PATH: { type: 'string', minLength: 1 },
    LOG_LEVEL: {
      type: 'string',
      enum: ['debug', 'info', 'warn', 'error'],
    },
  },
} as const;

export function validateWithEnvSchema(
  source: NodeJS.ProcessEnv,
): ValidatedEnvironment {
  const value = envSchema<ValidatedEnvironment>({
    schema: jsonSchema,
    data: source,
    dotenv: false,
  });

  return value;
}
