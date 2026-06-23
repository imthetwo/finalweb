import { prisma } from './prisma-client';

// Tất cả categories của shop — chỉ cần name là đủ
const CATEGORIES = [
  'Laptops',
  'Prebuilt PCs',
  'Processors (CPU)',
  'Graphics Cards (GPU)',
  'Motherboards',
  'RAM',
  'Storage (SSD/HDD)',
  'Power Supplies',
  'PC Cases',
  'CPU Coolers',
  'Case Fans',
  'Gaming Monitors',
  'Mechanical Keyboards',
  'Gaming Mice',
  'Gaming Headsets',
  'Gaming Furniture',
];

async function main() {
  // Xóa theo đúng thứ tự FK
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    console.log(`✅ ${name}`);
  }

  console.log(`\n🎉 Seeded ${CATEGORIES.length} categories`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
