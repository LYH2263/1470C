const TOKEN_KEY = 'auth_token';
export const REQUEST_ID_HEADER = 'X-Request-Id';

export function generateClientRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'client-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export interface ParsedApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  errorInfo?: {
    code: string;
    message: string;
    requestId?: string;
    details?: Record<string, unknown>;
  };
  requestId?: string;
  requestIdHeader?: string;
  httpStatus: number;
}

/**
 * 获取存储的token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 保存token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 删除token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 带认证的fetch请求
 * 自动添加Authorization header和X-Request-Id header
 * 处理401响应（清除token并跳转登录页）
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has(REQUEST_ID_HEADER)) {
    headers.set(REQUEST_ID_HEADER, generateClientRequestId());
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 处理401未授权响应
  if (response.status === 401) {
    removeToken();
    // 只在浏览器环境中跳转
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return response;
}

/**
 * 解析统一格式的 API 响应（向后兼容，同时支持旧格式 error 字符串和新格式 errorInfo 对象）
 */
export async function parseApiResponse<T>(
  response: Response
): Promise<ParsedApiResult<T>> {
  const requestIdHeader = response.headers.get(REQUEST_ID_HEADER) ?? undefined;
  let httpStatus = response.status;
  let result: any = {};

  try {
    result = await response.json();
  } catch {
    result = {
      success: response.ok,
    };
  }

  const ok = Boolean(result.success ?? response.ok);
  const errorMessage = extractErrorMessage(result);

  return {
    ok,
    data: result.data,
    error: errorMessage,
    errorCode: result.errorCode,
    errorInfo: result.errorInfo,
    requestId: result.requestId,
    requestIdHeader,
    httpStatus,
  };
}

function extractErrorMessage(result: any): string | undefined {
  if (result.errorInfo && typeof result.errorInfo === 'object' && result.errorInfo.message) {
    return String(result.errorInfo.message);
  }
  if (typeof result.error === 'string') {
    return result.error;
  }
  if (typeof result.message === 'string' && !result.success === false) {
    return result.message;
  }
  return undefined;
}
