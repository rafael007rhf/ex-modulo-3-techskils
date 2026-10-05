import {
  config,
  validateCurrentEnvironmentWithEnvSchema,
} from '../src/config';

const validated = validateCurrentEnvironmentWithEnvSchema();

console.log('env-schema validou a configuração.');
console.log({
  env: validated.NODE_ENV,
  port: validated.PORT,
  dbHost: validated.DB_HOST,
  envFile: config.envFile,
});
