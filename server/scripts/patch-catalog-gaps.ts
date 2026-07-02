/**
 * Patch catalog gaps:
 *   1. Fill missing lengthMm for 6 older GPU products
 *   2. Add 2 mATX case products (skip if already present by name)
 * Run: npx ts-node scripts/patch-catalog-gaps.ts
 */
import { prisma } from './prisma-client';

const GPU_LENGTHS: Record<string, number> = {
  'Gigabyte GeForce RTX 3060 Gaming OC 8G':         282,
  'Gigabyte GeForce RTX 3060 Windforce OC 12G':     272,
  'Inno3D GeForce RTX 3080 iChill X4 LHR':          323,
  'ASRock Radeon RX 7900 XTX Taichi White 24GB OC': 343,
  'ASRock Radeon RX 9070 XT Challenger 16GB':        285,
  'ASRock Radeon RX 9070 XT Steel Legend Dark 16GB': 305,
};

const MATX_CASES = [
  {
    name: 'Cooler Master MasterBox Q300L',
    brand: 'Cooler Master',
    price: 1290000,
    costPrice: 980000,
    salePrice: null,
    stock: 15,
    description: 'Cooler Master MasterBox Q300L Micro-ATX PC case, mATX motherboard support, GPU clearance up to 360 mm, 240mm radiator support, 2 drive bays.',
    spec: { formFactor: 'mATX', maxGpuLengthMm: 360, radiatorSupport: '240mm', driveBays: 2 },
  },
  {
    name: 'NZXT H5 Flow mATX',
    brand: 'NZXT',
    price: 1990000,
    costPrice: 1500000,
    salePrice: 1790000,
    stock: 10,
    description: 'NZXT H5 Flow mATX PC case, Micro-ATX motherboard support, GPU clearance up to 355 mm, 280mm radiator support, 2 drive bays. Perforated front panel for excellent airflow.',
    spec: { formFactor: 'mATX', maxGpuLengthMm: 355, radiatorSupport: '280mm', driveBays: 2 },
  },
];

async function main() {
  // ── 1. Patch GPU lengthMm ─────────────────────────────────────────────────
  console.log('── Patching GPU lengthMm ──────────────────────────────────────');
  for (const [name, lengthMm] of Object.entries(GPU_LENGTHS)) {
    const product = await prisma.product.findFirst({ where: { name } });
    if (!product) { console.log(`  ⚠️  Not found: ${name}`); continue; }
    await prisma.gpuSpec.update({ where: { productId: product.id }, data: { lengthMm } });
    console.log(`  ✅ ${name} → ${lengthMm}mm`);
  }

  // ── 2. Add mATX cases ─────────────────────────────────────────────────────
  console.log('\n── Adding mATX cases ──────────────────────────────────────────');
  const category = await prisma.category.findFirst({ where: { name: 'PC Cases' } });
  if (!category) throw new Error('Category "PC Cases" not found in DB');

  for (const c of MATX_CASES) {
    const existing = await prisma.product.findFirst({ where: { name: c.name } });
    if (existing) { console.log(`  ⏭️  Already exists: ${c.name}`); continue; }
    await prisma.product.create({
      data: {
        categoryId: category.id,
        name: c.name,
        brand: c.brand,
        imageUrl: null,
        price: c.price,
        costPrice: c.costPrice,
        salePrice: c.salePrice,
        stock: c.stock,
        isPublished: true,
        description: c.description,
        caseSpec: { create: c.spec },
      },
    });
    console.log(`  ✅ Created: ${c.name} (${c.spec.formFactor}, ${c.spec.maxGpuLengthMm}mm GPU clearance)`);
  }

  console.log('\nDone.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
