import { prisma } from './prisma-client';
async function main() {
  console.log('=== USERS ===');
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } , orderBy: { createdAt: 'asc' }});
  users.forEach(u => console.log(`  ${u.email} | ${u.role} | ${u.createdAt.toISOString().slice(0,16)}`));

  console.log('=== ORDERS ===');
  const orderCount = await prisma.order.count();
  console.log(`  total: ${orderCount}`);
  const orders = await prisma.order.findMany({ select: { id: true, status: true, isPaid: true, totalAmount: true, createdAt: true } });
  orders.forEach(o => console.log(`  #${o.id.slice(0,8)} ${o.status} paid=${o.isPaid} ${o.totalAmount} ${o.createdAt.toISOString().slice(0,16)}`));

  console.log('=== CART ITEMS (all users) ===');
  const carts = await prisma.cart.findMany({ include: { items: { include: { product: { select: { name: true } } } }, user: { select: { email: true } } } });
  for (const c of carts) {
    if (c.items.length) console.log(`  ${c.user.email}: ${c.items.map(i => `${i.product.name}(x${i.quantity})`).join(', ')}`);
  }

  console.log('=== PRODUCT STOCK SANITY (compare vs paid+pending orders) ===');
  const products = await prisma.product.findMany({ select: { id: true, name: true, stock: true } });
  console.log(`  total products: ${products.length}`);
  const negStock = products.filter(p => p.stock < 0);
  console.log(`  products with NEGATIVE stock: ${negStock.length}`, negStock.map(p=>p.name));

  console.log('=== NEWSLETTER SUBSCRIBERS (test emails?) ===');
  const subs = await prisma.newsletterSubscriber.findMany({ select: { email: true } });
  subs.forEach(s => console.log(`  ${s.email}`));

  console.log('=== WISHLIST entries ===');
  const wish = await prisma.wishlist.count();
  console.log(`  total: ${wish}`);
}
main().finally(() => prisma.$disconnect());
