/**
 * 1. Rename 4 orphaned Cloudinary images to proper TechStore/motherboard/ slugs
 * 2. Delete 3 duplicate orphaned images
 * 3. Update Gigabyte B760 imageUrl in DB + products.json
 * 4. Add 3 new motherboard products to DB + products.json
 */

import { prisma } from './prisma-client';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dxbvnueoq',
  api_key: '831889526896772',
  api_secret: 'bdUn39bTHpztcJ9IkBb6LoIzvYQ',
});

const CDN_BASE = 'https://res.cloudinary.com/dxbvnueoq/image/upload/f_auto,q_auto,w_600';

// ── Cloudinary operations ──────────────────────────────────────────────────
const RENAMES = [
  { from: '800_n2skbn',       to: 'TechStore/motherboard/gigabyte-b760-aorus-elite-ax'   },
  { from: 'item1_pd_wyh2yj',  to: 'TechStore/motherboard/asus-prime-b860m-a-wifi'        },
  { from: 'w692_1_fanvbo',    to: 'TechStore/motherboard/asus-prime-b760m-a-d4'          },
  { from: 'w692_permxr',      to: 'TechStore/motherboard/asus-prime-a620-plus-wifi6'     },
];

const DELETES = ['item2_pd_vehy2d', 'pd_g0zcll', 'w692_r8f0av'];

// ── New products to add ────────────────────────────────────────────────────
const NEW_PRODUCTS = [
  {
    name: 'ASUS PRIME B860M-A WiFi',
    brand: 'ASUS',
    imageSlug: 'asus-prime-b860m-a-wifi',
    price: 3490000,
    costPrice: 2800000,
    salePrice: null as number | null,
    stock: 10,
    description: 'ASUS PRIME B860M-A WiFi motherboard by ASUS, LGA1851 socket with B860 chipset, mATX form factor, 2× DDR5 slots, supports up to 96 GB RAM.',
    spec: { socket: 'LGA1851', chipset: 'B860', formFactor: 'mATX', ramGen: 'DDR5', ramSlots: 2, maxRamGb: 96 },
  },
  {
    name: 'ASUS PRIME B760M-A D4',
    brand: 'ASUS',
    imageSlug: 'asus-prime-b760m-a-d4',
    price: 2890000,
    costPrice: 2300000,
    salePrice: null as number | null,
    stock: 12,
    description: 'ASUS PRIME B760M-A D4 motherboard by ASUS, LGA1700 socket with B760 chipset, mATX form factor, 4× DDR4 slots, supports up to 128 GB RAM.',
    spec: { socket: 'LGA1700', chipset: 'B760', formFactor: 'mATX', ramGen: 'DDR4', ramSlots: 4, maxRamGb: 128 },
  },
  {
    name: 'ASUS PRIME A620-PLUS WiFi6',
    brand: 'ASUS',
    imageSlug: 'asus-prime-a620-plus-wifi6',
    price: 2690000,
    costPrice: 2100000,
    salePrice: null as number | null,
    stock: 14,
    description: 'ASUS PRIME A620-PLUS WiFi6 motherboard by ASUS, AM5 socket with A620 chipset, ATX form factor, 4× DDR5 slots, supports up to 192 GB RAM, WiFi 6 included.',
    spec: { socket: 'AM5', chipset: 'A620', formFactor: 'ATX', ramGen: 'DDR5', ramSlots: 4, maxRamGb: 192 },
  },
];

async function main() {
  // ── Step 1: Rename images in Cloudinary ─────────────────────────────────
  console.log('\n── Cloudinary renames ──');
  for (const r of RENAMES) {
    try {
      await cloudinary.uploader.rename(r.from, r.to, { invalidate: true });
      console.log(`✅ ${r.from} → ${r.to}`);
    } catch (e: any) {
      console.log(`⚠️  rename failed: ${r.from} — ${e.message}`);
    }
  }

  // ── Step 2: Delete duplicate orphans ────────────────────────────────────
  console.log('\n── Cloudinary deletes ──');
  for (const id of DELETES) {
    try {
      await cloudinary.uploader.destroy(id, { invalidate: true });
      console.log(`🗑️  deleted: ${id}`);
    } catch (e: any) {
      console.log(`⚠️  delete failed: ${id} — ${e.message}`);
    }
  }

  // ── Step 3: Update Gigabyte B760 imageUrl ───────────────────────────────
  console.log('\n── DB: update Gigabyte B760 imageUrl ──');
  const newGigabyteUrl = `${CDN_BASE}/TechStore/motherboard/gigabyte-b760-aorus-elite-ax`;
  const gig = await prisma.product.updateMany({
    where: { name: 'Gigabyte B760 AORUS ELITE AX' },
    data: { imageUrl: newGigabyteUrl },
  });
  console.log(`✅ Gigabyte B760 AORUS ELITE AX → updated ${gig.count} row(s)`);

  // ── Step 4: Add new products to DB ──────────────────────────────────────
  console.log('\n── DB: add new products ──');
  const mbCategory = await prisma.category.findFirst({ where: { name: 'Motherboards' } });
  if (!mbCategory) throw new Error('Motherboards category not found in DB');

  for (const p of NEW_PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      console.log(`⏭️  already exists: ${p.name}`);
      continue;
    }
    await prisma.product.create({
      data: {
        categoryId: mbCategory.id,
        name: p.name,
        brand: p.brand,
        imageUrl: `${CDN_BASE}/TechStore/motherboard/${p.imageSlug}`,
        price: p.price,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        stock: p.stock,
        isPublished: true,
        description: p.description,
        motherboardSpec: {
          create: p.spec,
        },
      },
    });
    console.log(`✅ Created: ${p.name}`);
  }

  // ── Step 5: Sync products.json ───────────────────────────────────────────
  console.log('\n── Sync products.json ──');
  const jsonPath = path.join(__dirname, '../data/products.json');
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const key = Object.keys(raw).find((k) => Array.isArray(raw[k]))!;
  const arr: any[] = raw[key];

  // Update Gigabyte imageUrl
  const gigProd = arr.find((p) => p.name === 'Gigabyte B760 AORUS ELITE AX');
  if (gigProd) gigProd.imageUrl = newGigabyteUrl;

  // Add new products (skip if already there)
  for (const p of NEW_PRODUCTS) {
    if (arr.find((x) => x.name === p.name)) continue;
    arr.push({
      category: 'Motherboards',
      name: p.name,
      brand: p.brand,
      imageUrl: `${CDN_BASE}/TechStore/motherboard/${p.imageSlug}`,
      price: p.price,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      stock: p.stock,
      isPublished: true,
      description: p.description,
      spec: { type: 'motherboardSpec', ...p.spec },
    });
  }

  fs.writeFileSync(jsonPath, JSON.stringify(raw, null, 2));
  console.log('✅ products.json updated');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
