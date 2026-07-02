/**
 * Patch motherboard products: update images + add new boards from products.json
 * Run: npx ts-node scripts/patch-motherboards.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from './prisma-client';

type ProductEntry = {
  category: string;
  name: string;
  brand: string;
  imageUrl: string;
  price: number;
  costPrice?: number | null;
  salePrice: number | null;
  stock: number;
  isPublished: boolean;
  description?: string | null;
  spec: Record<string, unknown> | null;
};

async function main() {
  const dataFile = path.join(__dirname, '..', 'data', 'products.json');
  const { products }: { products: ProductEntry[] } = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

  const motherboards = products.filter(p => p.category === 'Motherboards');
  const category = await prisma.category.findFirst({ where: { name: 'Motherboards' } });
  if (!category) throw new Error('Category "Motherboards" not found in DB');

  let updated = 0;
  let created = 0;

  for (const p of motherboards) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });

    if (existing) {
      // Update imageUrl only
      await prisma.product.update({ where: { id: existing.id }, data: { imageUrl: p.imageUrl } });
      console.log(`✏️  Updated image: ${p.name}`);
      updated++;
    } else {
      // Create new product
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
          costPrice: p.costPrice ?? null,
          salePrice: p.salePrice,
          stock: p.stock,
          isPublished: p.isPublished,
          description: p.description ?? null,
          ...specRelation,
        },
      });
      console.log(`✅ Created: ${p.name}`);
      created++;
    }
  }

  console.log(`\nDone — ${updated} updated, ${created} created.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
