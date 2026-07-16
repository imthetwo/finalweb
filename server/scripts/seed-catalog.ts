/**
 * Seed Category + Product from server/local_images/*
 * Run: npx ts-node scripts/seed-catalog.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from './prisma-client';

const LOCAL_IMAGES = path.join(__dirname, '..', 'local_images');

const FOLDER_MAP: Record<string, { name: string }> = {
  laptops: { name: 'Laptops' },
  PCs: { name: 'Prebuilt PCs' },
  cpu: { name: 'Processors (CPU)' },
  motherboard: { name: 'Motherboards' },
  memory: { name: 'RAM' },
  'power-supply': { name: 'Power Supplies' },
  'cpu-cooler': { name: 'CPU Coolers' },
  'case-fan': { name: 'Case Fans' },
  case: { name: 'PC Cases' },
  keyboard: { name: 'Mechanical Keyboards' },
  mouse: { name: 'Gaming Mice' },
  headphones: { name: 'Gaming Headsets' },
  monitor: { name: 'Gaming Monitors' },
  gpu: { name: 'Graphics Cards (GPU)' },
  storage: { name: 'Storage (SSD/HDD)' },
  funiture: { name: 'Gaming Furniture' },
};

const DEFAULT_PRICES: Record<string, number> = {
  gpu: 15000000,
  storage: 2500000,
  cpu: 8000000,
  motherboard: 7000000,
  memory: 2500000,
  'power-supply': 3000000,
  case: 3500000,
  keyboard: 2000000,
  mouse: 1500000,
  headphones: 2500000,
  laptops: 45000000,
  PCs: 40000000,
};

function guessBrand(name: string): string {
  const lower = name.toLowerCase();
  const brands = ['intel', 'amd', 'nvidia', 'asus', 'msi', 'corsair', 'nzxt', 'logitech', 'razer', 'cooler master', 'gigabyte'];
  for (const b of brands) {
    if (lower.includes(b)) return b.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return 'Pecify';
}

async function main() {
  let productCount = 0;

  for (const [folder, meta] of Object.entries(FOLDER_MAP)) {
    const folderPath = path.join(LOCAL_IMAGES, folder);
    if (!fs.existsSync(folderPath)) {
      console.warn(`⚠️  Skip missing folder: ${folder}`);
      continue;
    }

    let category = await prisma.category.findFirst({ where: { name: meta.name } });
    if (!category) {
      category = await prisma.category.create({ data: { name: meta.name } });
    }

    const files = fs.readdirSync(folderPath).filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));

    for (const file of files) {
      const base = file.replace(/\.[^.]+$/, '');
      const name = base.replace(/[-_]+/g, ' ').trim();
      const brand = guessBrand(base);
      const price = DEFAULT_PRICES[folder] ?? 2000000;
      const imageUrl = `/media/${folder}/${encodeURIComponent(file)}`;

      const existing = await prisma.product.findFirst({ where: { name, categoryId: category.id } });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { price, brand, isPublished: true, imageUrl },
        });
      } else {
        await prisma.product.create({
          data: { categoryId: category.id, name, brand, price, stock: 10, isPublished: true, imageUrl },
        });
      }
      productCount++;
    }

    console.log(`✅ ${folder}: ${files.length} products`);
  }

  console.log(`\n🎉 Seeded ${productCount} products from local_images`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
