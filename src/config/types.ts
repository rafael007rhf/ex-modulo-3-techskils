export type AppEnvironment = 'development' | 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFormat = 'human' | 'json';

export interface Config {
  readonly env: AppEnvironment;
  readonly envFile: string | null;
  readonly port: number;
  readonly db: Readonly<{
    host: string;
    password?: string;
  }>;
  readonly api: Readonly<{
    key: string;
  }>;
  readonly payment: Readonly<{
    url: string;
  }>;
  readonly log: Readonly<{
    path: string;
    level: LogLevel;
    format: LogFormat;
  }>;
  readonly http: Readonly<{
    includeStackInErrors: boolean;
  }>;
}
