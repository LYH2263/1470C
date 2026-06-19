import type { NextApiResponse } from 'next';
import { getUserWithPassword, verifyPassword, generateToken } from '@/lib/auth';
import {
  handleApiError,
  sendSuccessResponse,
  type AuthenticatedRequest,
  type UnifiedApiResponse,
} from '@/lib/middleware';
import { AppError, ErrorCode } from '@/lib/errors';

interface LoginSuccessData {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
}

interface LoginRequest {
  username: string;
  password: string;
}

const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const handler = handleApiError<LoginSuccessData>(async (
  req: AuthenticatedRequest,
  res: NextApiResponse<UnifiedApiResponse<LoginSuccessData>>
) => {
  if (req.method !== 'POST') {
    throw AppError.methodNotAllowed('仅支持POST请求', { requestId: req.requestId });
  }

  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    throw new AppError(ErrorCode.INVALID_INPUT, '用户名和密码不能为空', {
      requestId: req.requestId,
    });
  }

  const attempts = loginAttempts.get(username);
  if (attempts && attempts.lockUntil > Date.now()) {
    const remainingTime = Math.ceil((attempts.lockUntil - Date.now()) / 1000 / 60);
    throw new AppError(ErrorCode.TOO_MANY_ATTEMPTS, `登录失败次数过多，请在${remainingTime}分钟后重试`, {
      requestId: req.requestId,
      details: { username, remainingMinutes: remainingTime },
    });
  }

  const user = await getUserWithPassword(username);

  if (!user) {
    recordFailedAttempt(username);
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, '用户名或密码错误', {
      requestId: req.requestId,
      details: { username },
    });
  }

  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    recordFailedAttempt(username);
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, '用户名或密码错误', {
      requestId: req.requestId,
      details: { username },
    });
  }

  loginAttempts.delete(username);

  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  const { password: _, ...userInfo } = user;

  sendSuccessResponse(res, { token, user: userInfo }, req.requestId);
});

function recordFailedAttempt(username: string) {
  const attempts = loginAttempts.get(username) || { count: 0, lockUntil: 0 };
  attempts.count += 1;

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockUntil = Date.now() + LOCK_TIME;
  }

  loginAttempts.set(username, attempts);
}

export default handler;
