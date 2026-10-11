import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@factory.com' },
    update: {},
    create: {
      name: 'Factory Admin',
      email: 'admin@factory.com',
      passwordHash: adminHash,
      isAdmin: true,
      permissions: [],
    },
  });

  // Production staff (can log production + view stock)
  const prodHash = await bcrypt.hash('prod123', 10);
  await prisma.user.upsert({
    where: { email: 'production@factory.com' },
    update: {},
    create: {
      name: 'Production Staff',
      email: 'production@factory.com',
      passwordHash: prodHash,
      isAdmin: false,
      permissions: ['LOG_PRODUCTION'],
    },
  });

  // Dispatcher (dispatch vehicles + manage buyers + view stock)
  const dispHash = await bcrypt.hash('dispatch123', 10);
  await prisma.user.upsert({
    where: { email: 'dispatcher@factory.com' },
    update: {},
    create: {
      name: 'Dispatcher',
      email: 'dispatcher@factory.com',
      passwordHash: dispHash,
      isAdmin: false,
      permissions: ['DISPATCH_VEHICLES', 'MANAGE_BUYERS'],
    },
  });

  // Products
  const productData = [
    { name: 'TMT Bar', grade: 'Fe500D', unit: 'MT' },
    { name: 'TMT Bar', grade: 'Fe550D', unit: 'MT' },
    { name: 'Wire Rod', grade: 'SAE1008', unit: 'MT' },
    { name: 'Angle Iron', grade: 'IS2062', unit: 'MT' },
  ];

  for (const p of productData) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, grade: p.grade } });
    if (!existing) await prisma.product.create({ data: p });
  }

  // Buyers (login-less)
  const buyerData = [
    { name: 'Steel Traders Ltd', contact: '+91 98765 43210', address: 'Pune, Maharashtra' },
    { name: 'Bharat Iron Works', contact: '+91 87654 32109', address: 'Nagpur, Maharashtra' },
    { name: 'Modern Constructions', contact: '+91 76543 21098', address: 'Mumbai, Maharashtra' },
  ];

  for (const b of buyerData) {
    const existing = await prisma.buyer.findFirst({ where: { name: b.name } });
    if (!existing) {
      await prisma.buyer.create({
        data: { ...b, createdBy: admin.id },
      });
    }
  }

  console.log('Seed complete.\n');
  console.log('Admin:      admin@factory.com      / admin123');
  console.log('Production: production@factory.com / prod123');
  console.log('Dispatcher: dispatcher@factory.com / dispatch123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
