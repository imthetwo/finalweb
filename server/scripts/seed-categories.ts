// @ts-nocheck
// Seed tất cả categories (nav groups + catalog) không phụ thuộc local_images
import { CategoryKind, BuildSlot } from '@prisma/client';
import { prisma } from './prisma-client';

const NAV_GROUPS = [
  { slug: 'nav-laptops',          name: 'Laptops' },
  { slug: 'nav-pcs',              name: 'PCs' },
  { slug: 'nav-components',       name: 'Components' },
  { slug: 'nav-gaming-gear',      name: 'Gaming Gear' },
  { slug: 'nav-gaming-furniture', name: 'Gaming Furniture' },
];

const CATALOGS = [
  // Laptops
  { slug: 'laptops',              name: 'Laptops',                parent: 'nav-laptops',          kind: 'CATALOG',      sortOrder: 1 },
  { slug: 'prebuilt-pcs',         name: 'Prebuilt PCs',           parent: 'nav-pcs',              kind: 'CATALOG',      sortOrder: 1 },
  // Components
  { slug: 'processors',           name: 'Processors (CPU)',       parent: 'nav-components',       kind: 'CATALOG',      builderSlot: 'CPU',          sortOrder: 1 },
  { slug: 'graphics-cards',       name: 'Graphics Cards (GPU)',   parent: 'nav-components',       kind: 'CATALOG',      builderSlot: 'GPU',          sortOrder: 2 },
  { slug: 'motherboards',         name: 'Motherboards',           parent: 'nav-components',       kind: 'CATALOG',      builderSlot: 'MOTHERBOARD',  sortOrder: 3 },
  { slug: 'ram',                  name: 'RAM',                    parent: 'nav-components',       kind: 'CATALOG',      builderSlot: 'MEMORY',       sortOrder: 4 },
  { slug: 'storage',              name: 'Storage (SSD/HDD)',      parent: 'nav-components',       kind: 'CATALOG',      builderSlot: 'STORAGE',      sortOrder: 5 },
  { slug: 'power-supplies',       name: 'Power Supplies',         parent: 'nav-components',       kind: 'CATALOG',      builderSlot: 'POWER_SUPPLY', sortOrder: 6 },
  { slug: 'pc-cases',             name: 'PC Cases',               parent: 'nav-components',       kind: 'CATALOG',      builderSlot: 'CASE',         sortOrder: 7 },
  { slug: 'cpu-coolers',          name: 'CPU Coolers',            parent: 'nav-components',       kind: 'CATALOG',      builderSlot: 'CPU_COOLER',   sortOrder: 8 },
  { slug: 'case-fans',            name: 'Case Fans',              parent: 'nav-components',       kind: 'CATALOG',      builderSlot: 'CASE_FAN',     sortOrder: 9 },
  // Gaming Gear
  { slug: 'gaming-monitors',      name: 'Gaming Monitors',        parent: 'nav-gaming-gear',      kind: 'CATALOG',      sortOrder: 1 },
  { slug: 'mechanical-keyboards', name: 'Mechanical Keyboards',   parent: 'nav-gaming-gear',      kind: 'CATALOG',      sortOrder: 2 },
  { slug: 'wireless-mice',        name: 'Gaming Mice',            parent: 'nav-gaming-gear',      kind: 'CATALOG',      sortOrder: 3 },
  { slug: 'gaming-headsets',      name: 'Gaming Headsets',        parent: 'nav-gaming-gear',      kind: 'CATALOG',      sortOrder: 4 },
  // Furniture
  { slug: 'gaming-furniture',     name: 'Gaming Furniture',       parent: 'nav-gaming-furniture', kind: 'CATALOG',      sortOrder: 1 },
];

async function main() {
  // 1. Nav groups
  const navIds: Record<string, string> = {};
  for (const nav of NAV_GROUPS) {
    const c = await prisma.category.upsert({
      where: { slug: nav.slug },
      create: { slug: nav.slug, name: nav.name, kind: CategoryKind.NAV_GROUP },
      update: { name: nav.name },
    });
    navIds[nav.slug] = c.id;
    console.log(`✅ NAV: ${nav.slug}`);
  }

  // 2. Catalog categories
  for (const cat of CATALOGS) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        name: cat.name,
        kind: CategoryKind.CATALOG,
        parentId: navIds[cat.parent],
        sortOrder: cat.sortOrder,
        ...(cat.builderSlot ? { builderSlot: cat.builderSlot as BuildSlot } : {}),
      },
      update: { name: cat.name },
    });
    console.log(`✅ CAT: ${cat.slug}`);
  }

  console.log('\n🎉 All categories seeded!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
