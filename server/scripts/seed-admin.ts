import { OrderStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { prisma } from './prisma-client';

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // ── 1. Admin account ──
  await prisma.user.upsert({
    where: { email: 'admin@pecify.tech' },
    create: { email: 'admin@pecify.tech', password, fullName: 'Pecify Admin', role: Role.ADMIN },
    update: { role: Role.ADMIN },
  });
  console.log(`✅ Admin: admin@pecify.tech / admin123`);

  // ── 2. Demo customer ──
  const customer = await prisma.user.upsert({
    where: { email: 'customer@pecify.tech' },
    create: { email: 'customer@pecify.tech', password, fullName: 'Demo Customer', role: Role.USER },
    update: {},
  });
  console.log(`✅ Customer: customer@pecify.tech / admin123`);

  // ── 3. Sample orders (để admin dashboard có data) ──
  const products = await prisma.product.findMany({
    where: { isPublished: true, stock: { gt: 0 } },
    take: 6,
  });

  if (products.length < 2) {
    console.warn('⚠️  Chạy seed-clean-catalog.ts trước khi seed-admin.ts');
    return;
  }

  const statuses: OrderStatus[] = [
    OrderStatus.DELIVERED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.PENDING,
  ];

  let made = 0;
  for (let i = 0; i < 4; i++) {
    const picks = products.slice(i, i + 2);
    if (picks.length < 2) break;

    const totalAmount = picks.reduce((s, p) => s + (p.salePrice ?? p.price), 0);
    const status = statuses[i];

    await prisma.order.create({
      data: {
        userId: customer.id,
        totalAmount,
        paymentMethod: i % 2 === 0 ? 'COD' : 'MOMO',
        isPaid: status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED,
        status,
        shippingInfo: {
          recipient: 'Demo Customer',
          phone: '0900000000',
          street: '123 Demo St',
          district: 'Quận 1',
          city: 'Hồ Chí Minh',
        },
        items: {
          create: picks.map((p) => ({
            productId: p.id,
            quantity: 1,
            priceAtBuy: p.salePrice ?? p.price,
          })),
        },
      },
    });
    made++;
  }

  console.log(`✅ Sample orders: ${made}`);
  console.log('\n🎉 Seed admin hoàn tất.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
