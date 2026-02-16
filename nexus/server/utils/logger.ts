/**
 * Server-side Logger for Nexus
 *
 * Simple Node.js-compatible logger for server-side code.
 * Uses console methods with timestamp prefixes.
 *
 * Note: This is separate from the frontend logger at src/lib/monitoring/logger.ts
 * which uses Vite-specific import.meta.env.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default to 'info' in production, 'debug' in development
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

function formatMessage(level: LogLevel, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  return args
    .map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.message}\n${arg.stack}`;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
}

/**
 * Server-side logger instance
 */
export const logger = {
  debug(...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(`[${new Date().toISOString()}] [DEBUG]`, ...args);
    }
  },

  info(...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(`[${new Date().toISOString()}] [INFO]`, ...args);
    }
  },

  warn(...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(`[${new Date().toISOString()}] [WARN]`, ...args);
    }
  },

  error(...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(`[${new Date().toISOString()}] [ERROR]`, ...args);
    }
  },
};

export default logger;
