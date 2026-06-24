import * as path from 'path';
import * as fs from 'fs';
import { prisma } from './prisma-client';

type ProductEntry = {
  category: string;
  name: string;
  brand: string;
  imageUrl: string;
  price: number;
  salePrice: number | null;
  stock: number;
  isPublished: boolean;
  spec: Record<string, unknown> | null;
};

async function main() {
  console.log('🧹 Clearing old products and dependents…');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();

  const dataFile = path.join(__dirname, '..', 'data', 'products.json');
  const { products }: { products: ProductEntry[] } = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

  let count = 0;

  for (const p of products) {
    const category = await prisma.category.findFirst({ where: { name: p.category } });
    if (!category) {
      console.warn(`⚠️  Missing category: ${p.category}`);
      continue;
    }

    // Build spec relation nếu có
    const specRelation: Record<string, unknown> = {};
    if (p.spec) {
      const { type, ...fields } = p.spec;
      specRelation[type as string] = { create: fields };
    }

    await prisma.product.create({
      data: {
        categoryId: category.id,
        name: p.name,
        brand: p.brand,
        imageUrl: p.imageUrl,
        price: p.price,
        salePrice: p.salePrice,
        stock: p.stock,
        isPublished: p.isPublished,
        ...specRelation,
      },
    });
    count++;
  }

  console.log(`\n🎉 Seeded ${count} products from data/products.json`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
