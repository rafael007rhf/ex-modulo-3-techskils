import fs from 'node:fs';
import path from 'node:path';
import { config } from './config';
import type { LogFormat, LogLevel } from './config/types';

type LogContext = Record<string, unknown>;

const priority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const formatters: Record<
  LogFormat,
  (
    level: LogLevel,
    message: string,
    context: LogContext,
    date: Date,
  ) => string
> = {
  human: (level, message, context, date) => {
    const extra =
      Object.keys(context).length > 0
        ? ' ' + JSON.stringify(context)
        : '';

    return (
      '[' +
      date.toISOString() +
      '] ' +
      level.toUpperCase() +
      ' ' +
      message +
      extra
    );
  },
  json: (level, message, context, date) =>
    JSON.stringify({
      timestamp: date.toISOString(),
      level,
      message,
      ...context,
    }),
};

fs.mkdirSync(path.dirname(config.log.path), { recursive: true });

export function log(
  message: string,
  level: LogLevel = 'info',
  context: LogContext = {},
): void {
  if (priority[level] < priority[config.log.level]) {
    return;
  }

  const formatter = formatters[config.log.format];
  const line = formatter(level, message, context, new Date());

  fs.appendFileSync(config.log.path, line + '\n', 'utf8');
}
