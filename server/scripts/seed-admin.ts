import { OrderStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { prisma } from './prisma-client';

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // Seed accounts are created directly by this script, not through the public
  // register form, so the usual mandatory email-verification gate (see
  // AuthService.login) doesn't apply — they're marked verified up front, or
  // they'd be locked out of login entirely.

  // ── 1. Admin account — full access ──
  await prisma.user.upsert({
    where: { email: 'admin@pecify.tech' },
    create: { email: 'admin@pecify.tech', password, fullName: 'Pecify Admin', role: Role.ADMIN, isEmailVerified: true },
    update: { role: Role.ADMIN, isEmailVerified: true },
  });
  console.log(`✅ Admin: admin@pecify.tech / admin123`);

  // ── 2. Staff account — data entry, view inventory, view prices ──
  await prisma.user.upsert({
    where: { email: 'staff@pecify.tech' },
    create: { email: 'staff@pecify.tech', password, fullName: 'Pecify Staff', role: Role.STAFF, isEmailVerified: true },
    update: { role: Role.STAFF, isEmailVerified: true },
  });
  console.log(`✅ Staff:  staff@pecify.tech  / admin123`);

  // ── 3. Demo customer ──
  const customer = await prisma.user.upsert({
    where: { email: 'customer@pecify.tech' },
    create: { email: 'customer@pecify.tech', password, fullName: 'Demo Customer', role: Role.USER, isEmailVerified: true },
    update: { isEmailVerified: true },
  });
  console.log(`✅ Customer: customer@pecify.tech / admin123`);

  // ── 3. Sample orders (so the admin dashboard has data) ──
  const products = await prisma.product.findMany({
    where: { isPublished: true, stock: { gt: 0 } },
    take: 6,
  });

  if (products.length < 2) {
    console.warn('⚠️  Run seed-clean-catalog.ts before seed-admin.ts');
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
          ward: 'Phường Sài Gòn',
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

  console.log('\n🎉 Seed admin complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
