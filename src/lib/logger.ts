import type { JWTPayload } from './auth';
import type { AppError } from './errors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface RequestContext {
  requestId: string;
  method?: string;
  path?: string;
  query?: Record<string, unknown>;
  user?: JWTPayload;
  userAgent?: string;
  clientIp?: string;
}

export interface BaseLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

export interface ApiLogEntry extends BaseLogEntry {
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  username?: string;
  userRole?: string;
  userAgent?: string;
  clientIp?: string;
}

export interface ErrorLogEntry extends ApiLogEntry {
  level: 'error' | 'fatal';
  errorCode?: string;
  errorMessage?: string;
  errorStack?: string;
  errorDetails?: Record<string, unknown>;
  cause?: string;
  isOperational?: boolean;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

function getMinLogLevel(): LogLevel {
  const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  return LOG_LEVEL_PRIORITY[envLevel] !== undefined ? envLevel : 'info';
}

const MIN_LOG_LEVEL = getMinLogLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

function serializeError(error: unknown): {
  message: string;
  stack?: string;
  cause?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? error.cause.message : String(error.cause ?? ''),
    };
  }
  return {
    message: String(error),
  };
}

function writeLog(entry: BaseLogEntry | ErrorLogEntry): void {
  if (!shouldLog(entry.level)) {
    return;
  }

  const json = JSON.stringify(entry, (_key, value) => {
    if (value instanceof Error) {
      return serializeError(value);
    }
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });

  const stream = entry.level === 'error' || entry.level === 'fatal' ? process.stderr : process.stdout;
  stream.write(json + '\n');
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      requestId,
      context,
    });
  },

  info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      requestId,
      context,
    });
  },

  warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      requestId,
      context,
    });
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>, requestId?: string): void {
    const serialized = error ? serializeError(error) : undefined;
    writeLog({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      requestId,
      context,
      errorMessage: serialized?.message,
      errorStack: serialized?.stack,
      cause: serialized?.cause,
    });
  },

  fatal(message: string, error?: unknown, context?: Record<string, unknown>, requestId?: string): void {
    const serialized = error ? serializeError(error) : undefined;
    writeLog({
      timestamp: new Date().toISOString(),
      level: 'fatal',
      message,
      requestId,
      context,
      errorMessage: serialized?.message,
      errorStack: serialized?.stack,
      cause: serialized?.cause,
    });
  },
};

export function logApiError(
  appError: AppError,
  ctx: RequestContext,
  durationMs: number,
  statusCode: number
): void {
  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    level: statusCode >= 500 ? 'error' : 'warn',
    message: `API Error: ${appError.code} - ${appError.message}`,
    requestId: ctx.requestId,
    method: ctx.method,
    path: ctx.path,
    statusCode,
    durationMs,
    userId: ctx.user?.userId,
    username: ctx.user?.username,
    userRole: ctx.user?.role,
    userAgent: ctx.userAgent,
    clientIp: ctx.clientIp,
    errorCode: appError.code,
    errorMessage: appError.message,
    errorStack: appError.stack,
    errorDetails: appError.details,
    isOperational: appError.isOperational,
  };

  if (appError.cause) {
    const serialized = serializeError(appError.cause);
    entry.cause = serialized.message;
    if (serialized.stack && !entry.errorStack) {
      entry.errorStack = serialized.stack;
    }
  }

  writeLog(entry);
}

export function logApiRequest(
  ctx: RequestContext,
  statusCode: number,
  durationMs: number
): void {
  if (!shouldLog('info')) return;

  const entry: ApiLogEntry = {
    timestamp: new Date().toISOString(),
    level: statusCode >= 400 ? 'warn' : 'info',
    message: `${ctx.method} ${ctx.path} -> ${statusCode} (${durationMs}ms)`,
    requestId: ctx.requestId,
    method: ctx.method,
    path: ctx.path,
    statusCode,
    durationMs,
    userId: ctx.user?.userId,
    username: ctx.user?.username,
    userRole: ctx.user?.role,
    userAgent: ctx.userAgent,
    clientIp: ctx.clientIp,
  };

  writeLog(entry);
}
