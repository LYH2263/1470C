import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { verifyToken, getUserById, type JWTPayload } from './auth';
import {
  AppError,
  ErrorCode,
  normalizeError,
  type ErrorInfo,
} from './errors';
import {
  logger,
  logApiError,
  logApiRequest,
  type RequestContext,
} from './logger';

export const REQUEST_ID_HEADER = 'X-Request-Id' as const;

export interface AuthenticatedRequest extends NextApiRequest {
  user?: JWTPayload;
  requestId: string;
  startTime: number;
}

export interface UnifiedApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  errorInfo?: ErrorInfo;
  requestId?: string;
  message?: string;
}

type ApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

export function getClientIp(req: NextApiRequest): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]?.trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }
  return req.socket?.remoteAddress;
}

export function extractOrCreateRequestId(req: NextApiRequest): string {
  const headerId = req.headers[REQUEST_ID_HEADER.toLowerCase()];
  if (typeof headerId === 'string' && headerId.length > 0) {
    return headerId;
  }
  return randomUUID();
}

export function buildRequestContext(req: AuthenticatedRequest): RequestContext {
  return {
    requestId: req.requestId,
    method: req.method,
    path: req.url?.split('?')[0],
    query: req.query as Record<string, unknown>,
    user: req.user,
    userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    clientIp: getClientIp(req),
  };
}

export function sendErrorResponse(
  res: NextApiResponse<UnifiedApiResponse>,
  appError: AppError
): void {
  const statusCode = appError.statusCode;
  const errorInfo = appError.toErrorInfo();

  res.status(statusCode).json({
    success: false,
    error: appError.message,
    errorCode: appError.code,
    errorInfo,
    requestId: appError.requestId,
  });
}

export function sendSuccessResponse<T>(
  res: NextApiResponse<UnifiedApiResponse<T>>,
  data: T,
  requestId?: string,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(requestId ? { requestId } : undefined),
  });
}

export function handleApiError<TData = unknown>(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse<UnifiedApiResponse<TData>>
  ) => Promise<void> | void
) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse<UnifiedApiResponse<TData>>
  ): Promise<void> => {
    const startTime = Date.now();
    const requestId = extractOrCreateRequestId(req);

    (req as AuthenticatedRequest).requestId = requestId;
    (req as AuthenticatedRequest).startTime = startTime;

    res.setHeader(REQUEST_ID_HEADER, requestId);

    const authReq = req as AuthenticatedRequest;

    try {
      await handler(authReq, res);
    } catch (err) {
      const fallbackMessage = `请求处理失败: ${authReq.method} ${authReq.url}`;
      const appError = normalizeError(err, fallbackMessage);

      if (appError.requestId !== requestId) {
        Object.defineProperty(appError, 'requestId', {
          value: requestId,
          writable: false,
        });
      }

      const ctx = buildRequestContext(authReq);
      const durationMs = Date.now() - startTime;

      logApiError(appError, ctx, durationMs, appError.statusCode);
      sendErrorResponse(res, appError);
      return;
    }

    if (!res.headersSent) {
      return;
    }

    const durationMs = Date.now() - startTime;
    const statusCode = (res as unknown as { statusCode?: number }).statusCode ?? 0;

    if (statusCode >= 200 && statusCode < 400) {
      logApiRequest(buildRequestContext(authReq), statusCode, durationMs);
    }
  };
}

export function withAuth<TData = unknown>(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse<UnifiedApiResponse<TData>>
  ) => Promise<void> | void
) {
  return handleApiError<TData>(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(ErrorCode.UNAUTHORIZED, '未提供认证令牌', {
        requestId: req.requestId,
      });
    }

    const token = authHeader.substring(7);

    const payload = verifyToken(token);

    if (!payload) {
      throw new AppError(ErrorCode.INVALID_TOKEN, '认证令牌无效或已过期', {
        requestId: req.requestId,
      });
    }

    const user = await getUserById(payload.userId);

    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, '用户不存在', {
        requestId: req.requestId,
      });
    }

    req.user = payload;

    return handler(req, res);
  });
}

export { logger, logApiError, logApiRequest };
