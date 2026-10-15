import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error('ADMIN_PASSWORD env var is required');

  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: 'admin@factory.com' },
    update: { passwordHash: adminHash },
    create: {
      name: 'Factory Admin',
      email: 'admin@factory.com',
      passwordHash: adminHash,
      isAdmin: true,
      permissions: [],
    },
  });

  console.log('Seed complete.');
  console.log('Admin: admin@factory.com / <your ADMIN_PASSWORD>');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
