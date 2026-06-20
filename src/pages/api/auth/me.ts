import type { NextApiResponse } from 'next';
import { withAuth, type AuthenticatedRequest, type UnifiedApiResponse } from '@/lib/middleware';
import { getUserById } from '@/lib/auth';

type UserData = {
  id: string;
  username: string;
  name: string;
  role: string;
};

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<UnifiedApiResponse<UserData>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: '仅支持GET请求',
      errorCode: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    const userId = req.user!.userId;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误',
      errorCode: 'INTERNAL_ERROR',
    });
  }
}

export default withAuth(handler);
