// @ts-nocheck
/**
 * Seed an ADMIN account, sample coupons, and a few sample orders so the
 * admin dashboard + Excel report have data to show.
 *
 * Run AFTER seed-catalog.ts:  npx ts-node scripts/seed-admin.ts
 */
import { OrderStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { prisma } from './prisma-client';

async function main() {
  // ── 1. Admin account ──
  const adminEmail = 'admin@pecify.tech';
  const password = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, password, fullName: 'Pecify Admin', role: Role.ADMIN },
    update: { role: Role.ADMIN },
  });
  console.log(`✅ Admin: ${adminEmail} / admin123`);

  // ── 2. A demo customer ──
  const custEmail = 'customer@pecify.tech';
  const customer = await prisma.user.upsert({
    where: { email: custEmail },
    create: { email: custEmail, password, fullName: 'Demo Customer', role: Role.USER },
    update: {},
  });
  console.log(`✅ Customer: ${custEmail} / admin123`);

  // ── 3. Coupons ──
  const coupons = [
    { code: 'WELCOME10', discountPct: 10, maxUse: 1000, minOrderValue: 2000000 },
    { code: 'PECIFY500K', discountFixed: 500000, maxUse: 500, minOrderValue: 10000000 },
    { code: 'FREESHIP', discountFixed: 30000, maxUse: 9999, minOrderValue: 0 },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      create: {
        ...c,
        validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        isActive: true,
      },
      update: { isActive: true },
    });
  }
  console.log(`✅ Coupons: ${coupons.map((c) => c.code).join(', ')}`);

  // ── 4. Sample orders (for dashboard + Excel) ──
  const products = await prisma.product.findMany({
    where: { isPublished: true, stock: { gt: 0 } },
    take: 6,
  });
  if (products.length >= 2) {
    const statuses: OrderStatus[] = [
      OrderStatus.DELIVERED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.PENDING,
    ];
    let made = 0;
    for (let i = 0; i < 4; i++) {
      const picks = products.slice(i, i + 2);
      if (picks.length < 2) break;
      const subTotal = picks.reduce((s, p) => s + (p.salePrice ?? p.price), 0);
      const shippingFee = 30000;
      const status = statuses[i];
      await prisma.order.create({
        data: {
          userId: customer.id,
          subTotal,
          shippingFee,
          totalAmount: subTotal + shippingFee,
          paymentMethod: i % 2 === 0 ? 'COD' : 'MOMO',
          isPaid: status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED,
          status,
          shippingInfo: { recipient: 'Demo Customer', phone: '0900000000', street: '123 Demo St', district: 'D1', city: 'HCMC' },
          items: {
            create: picks.map((p) => ({ productId: p.id, quantity: 1, priceAtBuy: p.salePrice ?? p.price })),
          },
        },
      });
      made++;
    }
    console.log(`✅ Sample orders: ${made}`);
  } else {
    console.warn('⚠️  Not enough products to create sample orders — run seed-catalog.ts first.');
  }

  console.log('\n🎉 Admin seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
