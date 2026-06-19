import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('E2E 种子数据: 创建管理员账号...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '管理员',
      role: 'admin',
    },
  });

  console.log('E2E 种子数据: 管理员账号已就绪 (admin / admin123)');

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('E2E 种子数据失败:', e);
    process.exit(1);
  });
