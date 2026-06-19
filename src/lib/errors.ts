import { randomUUID } from 'crypto';

export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export const HTTP_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.UNPROCESSABLE_ENTITY]: 422,
  [ErrorCode.TOO_MANY_ATTEMPTS]: 429,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.FILE_TOO_LARGE]: 400,
  [ErrorCode.INVALID_FILE_TYPE]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
};

export const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.UNAUTHORIZED]: '未授权访问',
  [ErrorCode.INVALID_TOKEN]: '认证令牌无效或已过期',
  [ErrorCode.FORBIDDEN]: '无权限访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.METHOD_NOT_ALLOWED]: '请求方法不允许',
  [ErrorCode.CONFLICT]: '资源冲突',
  [ErrorCode.UNPROCESSABLE_ENTITY]: '请求无法处理',
  [ErrorCode.TOO_MANY_ATTEMPTS]: '请求过于频繁',
  [ErrorCode.INVALID_INPUT]: '输入参数无效',
  [ErrorCode.INVALID_CREDENTIALS]: '用户名或密码错误',
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.VALIDATION_ERROR]: '数据验证失败',
  [ErrorCode.FILE_TOO_LARGE]: '文件过大',
  [ErrorCode.INVALID_FILE_TYPE]: '不支持的文件类型',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂不可用',
};

export interface ErrorInfo {
  code: ErrorCode;
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly requestId: string;
  public readonly cause?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message?: string,
    options: {
      details?: Record<string, unknown>;
      requestId?: string;
      cause?: unknown;
      isOperational?: boolean;
    } = {}
  ) {
    const finalMessage = message ?? DEFAULT_MESSAGES[code];
    super(finalMessage);

    this.name = 'AppError';
    this.code = code;
    this.statusCode = HTTP_STATUS_MAP[code];
    this.details = options.details;
    this.requestId = options.requestId ?? randomUUID();
    this.cause = options.cause;
    this.isOperational = options.isOperational ?? true;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  static badRequest(message?: string, details?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.BAD_REQUEST, message, { details });
  }

  static unauthorized(message?: string, details?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, { details });
  }

  static invalidToken(message?: string, details?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.INVALID_TOKEN, message, { details });
  }

  static forbidden(message?: string, details?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, { details });
  }

  static notFound(message?: string, details?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.NOT_FOUND, message, { details });
  }

  static methodNotAllowed(message?: string, details?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.METHOD_NOT_ALLOWED, message, { details });
  }

  static validationError(message?: string, details?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, { details });
  }

  static internal(message?: string, cause?: unknown, details?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, {
      cause,
      details,
      isOperational: false,
    });
  }

  toErrorInfo(): ErrorInfo {
    return {
      code: this.code,
      message: this.message,
      requestId: this.requestId,
      details: this.details,
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof AppError ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'statusCode' in error &&
      'isOperational' in error &&
      (error as { name?: string }).name === 'AppError')
  );
}

export function normalizeError(
  error: unknown,
  fallbackMessage: string = DEFAULT_MESSAGES[ErrorCode.INTERNAL_ERROR]
): AppError {
  if (isAppError(error)) {
    return error;
  }

  return new AppError(ErrorCode.INTERNAL_ERROR, fallbackMessage, {
    cause: error,
    isOperational: false,
  });
}
