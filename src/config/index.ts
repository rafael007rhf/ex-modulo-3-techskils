import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import type { AppEnvironment, Config, LogLevel } from './types';
import {
  validateWithEnvSchema,
  validateWithJoi,
  type ValidatedEnvironment,
} from './validators';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const LOG_ROOT = path.resolve(PROJECT_ROOT, 'logs');

function selectEnvironment(raw: string | undefined): AppEnvironment {
  const value = raw?.trim() || 'development';

  if (value !== 'development' && value !== 'production') {
    throw new Error(
      'NODE_ENV inválida. Use somente development ou production.',
    );
  }

  return value;
}

const selectedEnvironment = selectEnvironment(process.env.NODE_ENV);

if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = selectedEnvironment;
}

function envCandidates(environment: AppEnvironment): string[] {
  if (environment === 'production') {
    return ['.env.prod'];
  }

  return ['.env.dev', '.env'];
}

function loadEnvironmentFile(environment: AppEnvironment): string | null {
  const candidate = envCandidates(environment)
    .map((name) => ({
      name,
      absolutePath: path.resolve(PROJECT_ROOT, name),
    }))
    .find((item) => fs.existsSync(item.absolutePath));

  if (!candidate) {
    return null;
  }

  const loaded = dotenv.config({
    path: candidate.absolutePath,
    override: false,
  });

  if (loaded.error) {
    throw new Error(
      'Falha ao carregar o arquivo de ambiente ' + candidate.name + '.',
    );
  }

  dotenvExpand.expand(loaded);

  return candidate.name;
}

const envFile = loadEnvironmentFile(selectedEnvironment);

function defaultLogLevel(environment: AppEnvironment): LogLevel {
  return environment === 'production' ? 'info' : 'debug';
}

function resolveLogPath(
  rawPath: string | undefined,
  environment: AppEnvironment,
): string {
  const configuredPath =
    rawPath?.trim() || './logs/' + environment + '.log';

  const resolvedPath = path.resolve(PROJECT_ROOT, configuredPath);
  const relativeToLogs = path.relative(LOG_ROOT, resolvedPath);

  const escapesLogDirectory =
    relativeToLogs === '' ||
    relativeToLogs.startsWith('..' + path.sep) ||
    relativeToLogs === '..' ||
    path.isAbsolute(relativeToLogs);

  if (escapesLogDirectory) {
    throw new Error(
      'LOG_PATH inválido: o arquivo deve permanecer dentro da pasta logs/.',
    );
  }

  return resolvedPath;
}

function buildConfig(environment: ValidatedEnvironment): Config {
  const db = Object.freeze({
    host: environment.DB_HOST,
    ...(environment.DB_PASSWORD
      ? { password: environment.DB_PASSWORD }
      : {}),
  });

  const api = Object.freeze({
    key: environment.API_KEY,
  });

  const payment = Object.freeze({
    url: environment.PAYMENT_URL,
  });

  const log = Object.freeze({
    path: resolveLogPath(environment.LOG_PATH, environment.NODE_ENV),
    level:
      environment.LOG_LEVEL || defaultLogLevel(environment.NODE_ENV),
    format:
      environment.NODE_ENV === 'production'
        ? ('json' as const)
        : ('human' as const),
  });

  const http = Object.freeze({
    includeStackInErrors: environment.NODE_ENV === 'development',
  });

  return Object.freeze({
    env: environment.NODE_ENV,
    envFile,
    port: environment.PORT,
    db,
    api,
    payment,
    log,
    http,
  });
}

const validatedEnvironment = validateWithJoi(
  process.env,
  selectedEnvironment,
);

export const config: Config = buildConfig(validatedEnvironment);

export function validateCurrentEnvironmentWithEnvSchema(): ValidatedEnvironment {
  return validateWithEnvSchema(process.env);
}

export type { Config } from './types';
