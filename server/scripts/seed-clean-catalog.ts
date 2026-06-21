// @ts-nocheck
import { prisma } from './prisma-client';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function main() {
  console.log('🧹 Clearing old products and dependents…');
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.buildItem.deleteMany();
  await prisma.customBuild.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  let count = 0;

  // ─── HELPER ───────────────────────────────────────────────────────────────
  async function createProduct(slug: string, p: any, specRelation?: object) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) { console.warn(`⚠️  Missing category: ${slug}`); return; }
    const BUILDER_SLOTS: Record<string, string> = {
      processors: 'CPU', motherboards: 'MOTHERBOARD', ram: 'MEMORY',
      'graphics-cards': 'GPU', storage: 'STORAGE', 'power-supplies': 'POWER_SUPPLY',
      'pc-cases': 'CASE', 'cpu-coolers': 'CPU_COOLER', 'case-fans': 'CASE_FAN',
    };
    const sku = `PEC-${slugify(p.name)}`.slice(0, 60);
    await prisma.product.create({
      data: {
        categoryId: category.id,
        sku,
        slug: slugify(p.name),
        name: p.name,
        brand: p.brand,
        localImagePath: `local_images/${p.folder}/${p.file}`,
        images: [{ url: `/media/${p.folder}/${encodeURIComponent(p.file)}`, view: 'hero' }],
        price: p.price,
        salePrice: p.sale ?? null,
        stock: p.stock ?? Math.floor(Math.random() * 30) + 8,
        isPublished: true,
        isPrebuilt: slug === 'prebuilt-pcs',
        isBuilderEligible: Boolean(BUILDER_SLOTS[slug]),
        ...specRelation,
      },
    });
    count++;
  }

  // ─── CPU ──────────────────────────────────────────────────────────────────
  const cpus = [
    { folder: 'cpu', file: 'cpu-intel-core-ultra-9-285k-up-to-5-7ghz-20-cores-20-threads-36mb-01.jpg', name: 'Intel Core Ultra 9 285K', brand: 'Intel', price: 15990000, sale: 14990000, socket: 'LGA1851', cores: 20, threads: 20, baseClockGhz: 3.7, boostClockGhz: 5.7, tdp: 125, cacheL3: '36MB', generation: 'Core Ultra 200' },
    { folder: 'cpu', file: 'cpu-intel-core-ultra-7-265k-up-to-5-5ghz-20-cores-20-threads-30mb-03.jpg', name: 'Intel Core Ultra 7 265K', brand: 'Intel', price: 11990000, sale: 10990000, socket: 'LGA1851', cores: 20, threads: 20, baseClockGhz: 3.9, boostClockGhz: 5.5, tdp: 125, cacheL3: '30MB', generation: 'Core Ultra 200' },
    { folder: 'cpu', file: 'cpu-intel-core-ultra-5-245k-up-to-5-2ghz-14-cores-14-threads-24mb-01.jpg', name: 'Intel Core Ultra 5 245K', brand: 'Intel', price: 7990000, socket: 'LGA1851', cores: 14, threads: 14, baseClockGhz: 4.2, boostClockGhz: 5.2, tdp: 125, cacheL3: '24MB', generation: 'Core Ultra 200' },
    { folder: 'cpu', file: 'cpu-intel-core-i7-14700k-up-to-5-6ghz-20-cores-28-threads-33mb-tray-new-01.jpg', name: 'Intel Core i7-14700K', brand: 'Intel', price: 10990000, sale: 9990000, socket: 'LGA1700', cores: 20, threads: 28, baseClockGhz: 3.4, boostClockGhz: 5.6, tdp: 125, cacheL3: '33MB', generation: 'Raptor Lake' },
    { folder: 'cpu', file: '14600k-tray.jpg', name: 'Intel Core i5-14600K', brand: 'Intel', price: 5990000, socket: 'LGA1700', cores: 14, threads: 20, baseClockGhz: 3.5, boostClockGhz: 5.3, tdp: 125, cacheL3: '24MB', generation: 'Raptor Lake' },
    { folder: 'cpu', file: '12400f-tray.jpg', name: 'Intel Core i5-12400F', brand: 'Intel', price: 3490000, sale: 2990000, socket: 'LGA1700', cores: 6, threads: 12, baseClockGhz: 2.5, boostClockGhz: 4.4, tdp: 65, cacheL3: '18MB', generation: 'Alder Lake' },
    { folder: 'cpu', file: '14700-tray.jpg', name: 'AMD Ryzen 9 9950X', brand: 'AMD', price: 14490000, sale: 13490000, socket: 'AM5', cores: 16, threads: 32, baseClockGhz: 4.3, boostClockGhz: 5.7, tdp: 170, cacheL3: '64MB', generation: 'Ryzen 9000' },
    { folder: 'cpu', file: '14700kf-tray.jpg', name: 'AMD Ryzen 7 9800X3D', brand: 'AMD', price: 12990000, socket: 'AM5', cores: 8, threads: 16, baseClockGhz: 4.7, boostClockGhz: 5.2, tdp: 120, cacheL3: '96MB', generation: 'Ryzen 9000' },
  ];
  for (const p of cpus) {
    await createProduct('processors', p, {
      cpuSpec: { create: { socket: p.socket, cores: p.cores, threads: p.threads, baseClockGhz: p.baseClockGhz, boostClockGhz: p.boostClockGhz, tdp: p.tdp, cacheL3: p.cacheL3, generation: p.generation } },
    });
  }
  console.log(`✅ processors: ${cpus.length}`);

  // ─── GPU ──────────────────────────────────────────────────────────────────
  const gpus = [
    { folder: 'gpu', file: 'nvidia_rtx-4090-fe.png', name: 'NVIDIA GeForce RTX 4090 Founders Edition', brand: 'NVIDIA', price: 42990000, sale: 39990000, vramGb: 24, tdp: 450, lengthMm: 336, pcieGen: 4, boostClockMhz: 2520, memType: 'GDDR6X' },
    { folder: 'gpu', file: 'asus_rtx-4080-strix.png', name: 'ASUS ROG Strix RTX 4080 SUPER', brand: 'ASUS', price: 28990000, sale: 26990000, vramGb: 16, tdp: 320, lengthMm: 358, pcieGen: 4, boostClockMhz: 2610, memType: 'GDDR6X' },
    { folder: 'gpu', file: 'msi_rtx-4070-ti.png', name: 'MSI GeForce RTX 4070 Ti SUPRIM X', brand: 'MSI', price: 18990000, vramGb: 12, tdp: 285, lengthMm: 340, pcieGen: 4, boostClockMhz: 2760, memType: 'GDDR6X' },
    { folder: 'gpu', file: 'amd_radeon-rx-7900-xtx.png', name: 'AMD Radeon RX 7900 XTX', brand: 'AMD', price: 22990000, sale: 20990000, vramGb: 24, tdp: 355, lengthMm: 287, pcieGen: 4, boostClockMhz: 2615, memType: 'GDDR6' },
    { folder: 'gpu', file: 'gigabyte_rx-7900-xt.png', name: 'Gigabyte Radeon RX 7900 XT Gaming OC', brand: 'Gigabyte', price: 19990000, vramGb: 20, tdp: 315, lengthMm: 290, pcieGen: 4, boostClockMhz: 2150, memType: 'GDDR6' },
    { folder: 'gpu', file: '3080_iCHILL_Black_set.png', name: 'NVIDIA GeForce RTX 3080 iCHILL Black', brand: 'NVIDIA', price: 12990000, sale: 10990000, vramGb: 10, tdp: 320, lengthMm: 305, pcieGen: 4, boostClockMhz: 1710, memType: 'GDDR6X' },
  ];
  for (const p of gpus) {
    await createProduct('graphics-cards', p, {
      gpuSpec: { create: { vramGb: p.vramGb, tdp: p.tdp, lengthMm: p.lengthMm, pcieGen: p.pcieGen, boostClockMhz: p.boostClockMhz, memType: p.memType } },
    });
  }
  console.log(`✅ graphics-cards: ${gpus.length}`);

  // ─── MOTHERBOARD ──────────────────────────────────────────────────────────
  const motherboards = [
    { folder: 'motherboard', file: '47874.png', name: 'ASUS ROG MAXIMUS Z890 HERO', brand: 'ASUS', price: 14990000, sale: 13490000, socket: 'LGA1851', chipset: 'Z890', formFactor: 'ATX', ramGen: 'DDR5', ramSlots: 4, maxRamGb: 192 },
    { folder: 'motherboard', file: '47879.png', name: 'MSI MAG Z890 TOMAHAWK WIFI', brand: 'MSI', price: 7990000, socket: 'LGA1851', chipset: 'Z890', formFactor: 'ATX', ramGen: 'DDR5', ramSlots: 4, maxRamGb: 192 },
    { folder: 'motherboard', file: '47937.png', name: 'Gigabyte B760 AORUS ELITE AX', brand: 'Gigabyte', price: 4490000, socket: 'LGA1700', chipset: 'B760', formFactor: 'ATX', ramGen: 'DDR5', ramSlots: 4, maxRamGb: 128 },
    { folder: 'motherboard', file: '47953.png', name: 'ASUS ROG STRIX X870E-E GAMING', brand: 'ASUS', price: 11990000, sale: 10990000, socket: 'AM5', chipset: 'X870E', formFactor: 'ATX', ramGen: 'DDR5', ramSlots: 4, maxRamGb: 256 },
    { folder: 'motherboard', file: '47995.png', name: 'ASRock B650M PG Riptide', brand: 'ASRock', price: 3990000, socket: 'AM5', chipset: 'B650', formFactor: 'mATX', ramGen: 'DDR5', ramSlots: 4, maxRamGb: 128 },
    { folder: 'motherboard', file: '48178.png', name: 'MSI PRO B760M-A WIFI DDR4', brand: 'MSI', price: 2990000, socket: 'LGA1700', chipset: 'B760', formFactor: 'mATX', ramGen: 'DDR4', ramSlots: 4, maxRamGb: 128 },
  ];
  for (const p of motherboards) {
    await createProduct('motherboards', p, {
      motherboardSpec: { create: { socket: p.socket, chipset: p.chipset, formFactor: p.formFactor, ramGen: p.ramGen, ramSlots: p.ramSlots, maxRamGb: p.maxRamGb } },
    });
  }
  console.log(`✅ motherboards: ${motherboards.length}`);

  // ─── RAM ──────────────────────────────────────────────────────────────────
  const rams = [
    { folder: 'memory', file: 'DOMINATOR_TITANIUM_WH_Xl95Dvo.2e16d0ba.fill-630x380.format-webp.webp', name: 'Corsair Dominator Titanium DDR5 32GB 6600MHz', brand: 'Corsair', price: 8990000, sale: 7990000, capacityGb: 32, speedMhz: 6600, generation: 'DDR5', latency: 'CL32', kit: '2x16GB' },
    { folder: 'memory', file: 'Vengeance-RGB-DDR5-2UP-32GB-GRAY_01.webp', name: 'Corsair Vengeance RGB DDR5 32GB 6000MHz', brand: 'Corsair', price: 3490000, sale: 2990000, capacityGb: 32, speedMhz: 6000, generation: 'DDR5', latency: 'CL30', kit: '2x16GB' },
    { folder: 'memory', file: 'Vengeance-DDR5-2UP-BLACK_01.webp', name: 'Corsair Vengeance DDR5 32GB 5600MHz', brand: 'Corsair', price: 2790000, capacityGb: 32, speedMhz: 5600, generation: 'DDR5', latency: 'CL36', kit: '2x16GB' },
    { folder: 'memory', file: '30120.png', name: 'G.Skill Trident Z5 RGB DDR5 32GB 6400MHz', brand: 'G.Skill', price: 4290000, capacityGb: 32, speedMhz: 6400, generation: 'DDR5', latency: 'CL32', kit: '2x16GB' },
    { folder: 'memory', file: '30121.png', name: 'Kingston Fury Beast DDR5 16GB 5200MHz', brand: 'Kingston', price: 1790000, sale: 1490000, capacityGb: 16, speedMhz: 5200, generation: 'DDR5', latency: 'CL40', kit: '1x16GB' },
    { folder: 'memory', file: '30680.png', name: 'Kingston Fury Beast DDR4 16GB 3600MHz', brand: 'Kingston', price: 1290000, capacityGb: 16, speedMhz: 3600, generation: 'DDR4', latency: 'CL16', kit: '1x16GB' },
  ];
  for (const p of rams) {
    await createProduct('ram', p, {
      ramSpec: { create: { capacityGb: p.capacityGb, speedMhz: p.speedMhz, generation: p.generation, latency: p.latency, kit: p.kit } },
    });
  }
  console.log(`✅ ram: ${rams.length}`);

  // ─── STORAGE ──────────────────────────────────────────────────────────────
  const storages = [
    { folder: 'storage', file: 'vn-9100-pro-nvme-m2-ssd-539197-mz-vap8t0bw-thumb-548346257.png', name: 'Samsung 9100 PRO NVMe M.2 SSD 2TB', brand: 'Samsung', price: 4990000, sale: 4490000, capacityGb: 2000, storageType: 'NVMe', interfaceType: 'PCIe 5.0', readMbps: 14800, writeMbps: 13400 },
    { folder: 'storage', file: 'vn-990-evo-plus-nvme-m2-ssd-527828-mz-v9s4t0bw-thumb-544161194.png', name: 'Samsung 990 EVO Plus NVMe M.2 SSD 2TB', brand: 'Samsung', price: 3290000, sale: 2890000, capacityGb: 2000, storageType: 'NVMe', interfaceType: 'PCIe 4.0', readMbps: 7250, writeMbps: 6300 },
    { folder: 'storage', file: 'vn-870-evo-sata-3-2-5-ssd-486518-mz-77e8t0bw-thumb-551145127.png', name: 'Samsung 870 EVO SATA 2.5" SSD 2TB', brand: 'Samsung', price: 2190000, capacityGb: 2000, storageType: 'SSD', interfaceType: 'SATA', readMbps: 560, writeMbps: 530 },
    { folder: 'storage', file: 'vn-portable-ssd-mu-pd4t0g-ww-thumb-549696538.png', name: 'Samsung T9 Portable SSD 4TB', brand: 'Samsung', price: 5890000, sale: 5290000, capacityGb: 4000, storageType: 'SSD', interfaceType: 'USB 3.2', readMbps: 2000, writeMbps: 1950 },
  ];
  for (const p of storages) {
    await createProduct('storage', p, {
      storageSpec: { create: { capacityGb: p.capacityGb, storageType: p.storageType, interfaceType: p.interfaceType, readMbps: p.readMbps, writeMbps: p.writeMbps } },
    });
  }
  console.log(`✅ storage: ${storages.length}`);

  // ─── PSU ──────────────────────────────────────────────────────────────────
  const psus = [
    { folder: 'power-supply', file: 'Etail_C1000GoldCore_Carousel_Hero_EN.png', name: 'Corsair RM1000x 80+ Gold 1000W', brand: 'Corsair', price: 4990000, sale: 4490000, wattage: 1000, efficiency: '80+ Gold', modular: 'Full' },
    { folder: 'power-supply', file: 'Etail_C850GoldCore_Carousel_Hero_EN.png', name: 'Corsair RM850x 80+ Gold 850W', brand: 'Corsair', price: 3490000, wattage: 850, efficiency: '80+ Gold', modular: 'Full' },
    { folder: 'power-supply', file: 'Etail_C750GoldCore_Carousel_Hero_EN.png', name: 'Corsair RM750x 80+ Gold 750W', brand: 'Corsair', price: 2890000, sale: 2490000, wattage: 750, efficiency: '80+ Gold', modular: 'Full' },
    { folder: 'power-supply', file: 'Etail_C850SFXGold_Carousel_Hero_EN.png', name: 'Corsair SF850 SFX 80+ Gold 850W', brand: 'Corsair', price: 3990000, wattage: 850, efficiency: '80+ Gold', modular: 'Full' },
    { folder: 'power-supply', file: '120-G2-1300-XR_MD_1.png', name: 'EVGA SuperNOVA 1300 G2 80+ Gold 1300W', brand: 'EVGA', price: 6490000, wattage: 1300, efficiency: '80+ Gold', modular: 'Full' },
    { folder: 'power-supply', file: '100-GD-0600-V1_MD_1.png', name: 'Cooler Master MWE Gold 650W', brand: 'Cooler Master', price: 1890000, sale: 1690000, wattage: 650, efficiency: '80+ Gold', modular: 'Non' },
  ];
  for (const p of psus) {
    await createProduct('power-supplies', p, {
      psuSpec: { create: { wattage: p.wattage, efficiency: p.efficiency, modular: p.modular } },
    });
  }
  console.log(`✅ power-supplies: ${psus.length}`);

  // ─── CASE ─────────────────────────────────────────────────────────────────
  const cases = [
    { folder: 'case', file: 'Case_H9_Flow_RGB__WH_Carousel_Hero_EN_d5c60367-c559-4b2e-9fc1-2fefda287bed.png', name: 'NZXT H9 Flow RGB White', brand: 'NZXT', price: 3990000, sale: 3490000, formFactor: 'ATX', maxGpuLengthMm: 435, radiatorSupport: '360mm', driveBays: 2 },
    { folder: 'case', file: 'Case_H9_Flow_WH_Carousel_Hero_EN_6c6f2fc0-18de-4729-94c9-608b22094825.png', name: 'NZXT H9 Flow White', brand: 'NZXT', price: 3490000, formFactor: 'ATX', maxGpuLengthMm: 435, radiatorSupport: '360mm', driveBays: 2 },
    { folder: 'case', file: 'Etail_H3Flow_WH_Carousel_Hero_EN.png', name: 'NZXT H3 Flow White', brand: 'NZXT', price: 2190000, sale: 1890000, formFactor: 'ATX', maxGpuLengthMm: 360, radiatorSupport: '240mm', driveBays: 2 },
    { folder: 'case', file: 'elite-600-black-tc-gallery-01 (1).png', name: 'Cooler Master Elite 600', brand: 'Cooler Master', price: 1490000, formFactor: 'ATX', maxGpuLengthMm: 330, radiatorSupport: '240mm', driveBays: 3 },
    { folder: 'case', file: 'masterframe-360-series_overview (1).png', name: 'Cooler Master MasterFrame 360', brand: 'Cooler Master', price: 3990000, formFactor: 'ATX', maxGpuLengthMm: 400, radiatorSupport: '360mm', driveBays: 2 },
    { folder: 'case', file: 'q300l-v2-black-white-380x380-1.png', name: 'Cooler Master Q300L V2', brand: 'Cooler Master', price: 1290000, sale: 1090000, formFactor: 'mATX', maxGpuLengthMm: 360, radiatorSupport: '240mm', driveBays: 2 },
  ];
  for (const p of cases) {
    await createProduct('pc-cases', p, {
      caseSpec: { create: { formFactor: p.formFactor, maxGpuLengthMm: p.maxGpuLengthMm, radiatorSupport: p.radiatorSupport, driveBays: p.driveBays } },
    });
  }
  console.log(`✅ pc-cases: ${cases.length}`);

  // ─── CPU COOLER ───────────────────────────────────────────────────────────
  const coolers = [
    { folder: 'cpu-cooler', file: '01_Kraken_Plus__RGB_360_white_0191545f-9605-4ef0-aec0-895f4f13b01c.png', name: 'NZXT Kraken 360 RGB White AIO', brand: 'NZXT', price: 4990000, sale: 4490000, coolerType: 'AIO', tdpRating: 400, radiatorSizeMm: 360, socketSupport: 'AM5,AM4,LGA1700,LGA1851' },
    { folder: 'cpu-cooler', file: '01_Kraken_Plus__RGB_360_black_b8ce09c8-ea0b-4a78-99f5-97b8e81f5899.png', name: 'NZXT Kraken 360 RGB Black AIO', brand: 'NZXT', price: 4990000, coolerType: 'AIO', tdpRating: 400, radiatorSizeMm: 360, socketSupport: 'AM5,AM4,LGA1700,LGA1851' },
    { folder: 'cpu-cooler', file: '01_Kraken_Plus_RGB_240_white_7cf2ef28-fe55-4788-ba1e-c7c8dfd187e4.png', name: 'NZXT Kraken 240 RGB White AIO', brand: 'NZXT', price: 3490000, sale: 2990000, coolerType: 'AIO', tdpRating: 280, radiatorSizeMm: 240, socketSupport: 'AM5,AM4,LGA1700,LGA1851' },
    { folder: 'cpu-cooler', file: '01_KrakenPlus_nonRGB_280_black.png', name: 'NZXT Kraken 280 Black AIO', brand: 'NZXT', price: 2990000, coolerType: 'AIO', tdpRating: 325, radiatorSizeMm: 280, socketSupport: 'AM5,AM4,LGA1700,LGA1851' },
  ];
  for (const p of coolers) {
    await createProduct('cpu-coolers', p, {
      coolerSpec: { create: { coolerType: p.coolerType, tdpRating: p.tdpRating, radiatorSizeMm: p.radiatorSizeMm, socketSupport: p.socketSupport } },
    });
  }
  console.log(`✅ cpu-coolers: ${coolers.length}`);

  // ─── MONITOR ──────────────────────────────────────────────────────────────
  const monitors = [
    { folder: 'monitor', file: '46207.png', name: 'LG UltraGear 27" QHD 240Hz', brand: 'LG', price: 8990000, sale: 7990000, sizeIn: 27, resolution: '2560x1440', refreshRateHz: 240, panelType: 'IPS', responseMs: 1.0, hdr: true },
    { folder: 'monitor', file: '46266.png', name: 'Samsung Odyssey G7 32" 4K 165Hz', brand: 'Samsung', price: 12990000, sizeIn: 32, resolution: '3840x2160', refreshRateHz: 165, panelType: 'VA', responseMs: 1.0, hdr: true },
    { folder: 'monitor', file: '47103.png', name: 'ASUS ROG Swift 27" QHD 360Hz', brand: 'ASUS', price: 14990000, sale: 13490000, sizeIn: 27, resolution: '2560x1440', refreshRateHz: 360, panelType: 'IPS', responseMs: 0.5, hdr: false },
    { folder: 'monitor', file: '47387.png', name: 'Dell UltraSharp 27" 4K USB-C', brand: 'Dell', price: 9990000, sizeIn: 27, resolution: '3840x2160', refreshRateHz: 60, panelType: 'IPS', responseMs: 5.0, hdr: false },
    { folder: 'monitor', file: '47425.png', name: 'LG 34" UltraWide QHD 144Hz', brand: 'LG', price: 11990000, sizeIn: 34, resolution: '3440x1440', refreshRateHz: 144, panelType: 'IPS', responseMs: 1.0, hdr: true },
  ];
  for (const p of monitors) {
    await createProduct('gaming-monitors', p, {
      monitorSpec: { create: { sizeIn: p.sizeIn, resolution: p.resolution, refreshRateHz: p.refreshRateHz, panelType: p.panelType, responseMs: p.responseMs, hdr: p.hdr } },
    });
  }
  console.log(`✅ gaming-monitors: ${monitors.length}`);

  // ─── LAPTOP ───────────────────────────────────────────────────────────────
  const laptops = [
    { folder: 'laptops', file: 'razer_blade-16-2024.png', name: 'Razer Blade 16 (2024) RTX 4090', brand: 'Razer', price: 69990000, sale: 64990000, cpu: 'Intel Core i9-14900HX', gpu: 'RTX 4090', ramGb: 32, storageGb: 2000, displaySizeIn: 16, displayResolution: '2560x1600', os: 'Windows 11' },
    { folder: 'laptops', file: 'razer_blade-14-2024.png', name: 'Razer Blade 14 (2024) RTX 4070', brand: 'Razer', price: 54990000, cpu: 'AMD Ryzen 9 8945HX', gpu: 'RTX 4070', ramGb: 16, storageGb: 1000, displaySizeIn: 14, displayResolution: '2560x1600', os: 'Windows 11' },
    { folder: 'laptops', file: 'product_17150494753022d6ce5a404d8aad962fd3c40935ae.webp', name: 'ASUS ROG Zephyrus G16 RTX 4080', brand: 'ASUS', price: 48990000, sale: 45990000, cpu: 'Intel Core Ultra 9 185H', gpu: 'RTX 4080', ramGb: 32, storageGb: 2000, displaySizeIn: 16, displayResolution: '2560x1600', os: 'Windows 11' },
    { folder: 'laptops', file: 'product_1772422403c8210c439aa9be7ff42de8aab289f087.webp', name: 'MSI Stealth 16 AI Studio', brand: 'MSI', price: 52990000, cpu: 'Intel Core Ultra 7 155H', gpu: 'RTX 4070 Ti', ramGb: 32, storageGb: 2000, displaySizeIn: 16, displayResolution: '3840x2400', os: 'Windows 11' },
  ];
  for (const p of laptops) {
    await createProduct('laptops', p, {
      laptopSpec: { create: { cpu: p.cpu, gpu: p.gpu, ramGb: p.ramGb, storageGb: p.storageGb, displaySizeIn: p.displaySizeIn, displayResolution: p.displayResolution, os: p.os } },
    });
  }
  console.log(`✅ laptops: ${laptops.length}`);

  // ─── PERIPHERALS (no spec table) ──────────────────────────────────────────
  const peripherals: { slug: string; items: any[] }[] = [
    { slug: 'case-fans', items: [
      { folder: 'case-fan', file: 'Etail_F120X_White_Carousel_Hero_EN.png', name: 'Corsair iCUE LINK RX120 RGB White 3-Pack', brand: 'Corsair', price: 1990000, sale: 1690000 },
      { folder: 'case-fan', file: 'Etail_F120X_Black_Carousel_Hero_EN.png', name: 'Corsair iCUE LINK RX120 RGB Black 3-Pack', brand: 'Corsair', price: 1990000 },
      { folder: 'case-fan', file: 'Etail_F360X_Black_Carousel_Hero_EN.png', name: 'Corsair iCUE LINK RX360 RGB Black', brand: 'Corsair', price: 990000, sale: 790000 },
      { folder: 'case-fan', file: 'f140p-hero-white.png', name: 'Corsair AF140 Elite White', brand: 'Corsair', price: 690000 },
    ]},
    { slug: 'mechanical-keyboards', items: [
      { folder: 'keyboard', file: 'g515-lightspeed-tkl-top-angle-gallery-1-en-fr.png', name: 'Logitech G515 Lightspeed TKL', brand: 'Logitech', price: 4290000, sale: 3790000 },
      { folder: 'keyboard', file: 'g915-x-tkl-wireless-keyboard-gallery-1-us.png', name: 'Logitech G915 X TKL Wireless', brand: 'Logitech', price: 5490000 },
      { folder: 'keyboard', file: 'g512-x-75-black-top-angle-gallery-1.png', name: 'Logitech G512 X RGB Mechanical', brand: 'Logitech', price: 2490000, sale: 1990000 },
      { folder: 'keyboard', file: 'pro-x-tkl-rapid-black-gallery-1-us.png', name: 'Logitech G PRO X TKL RAPID', brand: 'Logitech', price: 3990000 },
      { folder: 'keyboard', file: 'g413-se-gallery-4-new.png', name: 'Logitech G413 SE Mechanical', brand: 'Logitech', price: 1490000 },
      { folder: 'keyboard', file: 'g213-gallery-1-nb.png', name: 'Logitech G213 Prodigy RGB', brand: 'Logitech', price: 990000, sale: 790000 },
    ]},
    { slug: 'wireless-mice', items: [
      { folder: 'mouse', file: 'g309-lightspeed-wireless-mouse-white-gallery-1.png', name: 'Logitech G309 Lightspeed Wireless White', brand: 'Logitech', price: 1790000, sale: 1490000 },
      { folder: 'mouse', file: 'g502-hero-mouse-top-angle-gallery-1.png', name: 'Logitech G502 HERO', brand: 'Logitech', price: 1490000 },
      { folder: 'mouse', file: 'g305-lightspeed-mouse-top-angle-black-gallery-1.png', name: 'Logitech G305 Lightspeed', brand: 'Logitech', price: 990000, sale: 790000 },
      { folder: 'mouse', file: 'g403-hero-mouse-top-angle-black-gallery-1.png', name: 'Logitech G403 HERO', brand: 'Logitech', price: 1290000 },
      { folder: 'mouse', file: 'g203-mouse-top-angle-black-gallery-1.png', name: 'Logitech G203 Lightsync', brand: 'Logitech', price: 590000 },
    ]},
    { slug: 'gaming-headsets', items: [
      { folder: 'headphones', file: 'g733-white-gallery-1.png', name: 'Logitech G733 Lightspeed Wireless White', brand: 'Logitech', price: 3490000, sale: 2990000 },
      { folder: 'headphones', file: 'g535-wireless-gallery-1.png', name: 'Logitech G535 Lightspeed Wireless', brand: 'Logitech', price: 2490000 },
      { folder: 'headphones', file: 'g633-gallery-1.png', name: 'Logitech G635 RGB Gaming Headset', brand: 'Logitech', price: 2990000 },
      { folder: 'headphones', file: 'g522-midnight-black-3qtr-front-left-gallery-1.png', name: 'Logitech G522 Gaming Headset', brand: 'Logitech', price: 2290000, sale: 1990000 },
      { folder: 'headphones', file: 'g435-3qtr-front-left-angle-black-gallery-1.png', name: 'Logitech G435 Lightspeed Wireless', brand: 'Logitech', price: 1490000 },
      { folder: 'headphones', file: 'g335-black-gallery-1.png', name: 'Logitech G335 Wired Gaming Headset', brand: 'Logitech', price: 1790000 },
    ]},
    { slug: 'gaming-furniture', items: [
      { folder: 'funiture', file: 'CF-9010068-WW_01.webp', name: 'Corsair TC500 LUXE Gaming Chair', brand: 'Corsair', price: 9900000, sale: 8490000 },
      { folder: 'funiture', file: 'ChairPro.webp', name: 'Pecify ChairPro Ergonomic', brand: 'Pecify', price: 7990000 },
      { folder: 'funiture', file: 'ErgoCore.webp', name: 'Pecify ErgoCore Mesh Chair', brand: 'Pecify', price: 6900000, sale: 5990000 },
      { folder: 'funiture', file: 'PLATFORM_4_FIXED_BLACK_R_07.png', name: 'Corsair Platform:4 Gaming Desk', brand: 'Corsair', price: 5900000 },
      { folder: 'funiture', file: 'PLATFORM_4_ELEVATE_WOOD_R_07.png', name: 'Corsair Platform:4 Elevate Standing Desk', brand: 'Corsair', price: 8900000, sale: 7900000 },
      { folder: 'funiture', file: 'T3-RUSH-Fabric-Gaming-Chair-_2023_---Charcoal-0.webp', name: 'Thermaltake T3 RUSH Fabric Chair', brand: 'Thermaltake', price: 7490000, sale: 6490000 },
    ]},
    { slug: 'prebuilt-pcs', items: [
      { folder: 'PCs', file: 'h7-flow-rgb-hero-white.png', name: 'Pecify Vortex — RTX 4090 / Ultra 9', brand: 'Pecify', price: 75990000, sale: 72990000 },
      { folder: 'PCs', file: 'h6-flow-rgb-hero-white.png', name: 'Pecify Stealth — RTX 4070 / i7-14700K', brand: 'Pecify', price: 42990000, sale: 39990000 },
      { folder: 'PCs', file: 'h7-flow-hero-white.png', name: 'Pecify Frost — RTX 4070 Ti / Ultra 7', brand: 'Pecify', price: 38990000 },
      { folder: 'PCs', file: 'cHNKLnCSQFWZ4NQovq2Byrvrxt3XmnDDFHT2MgjC.png', name: 'Pecify Mini — ITX RTX 4060 Build', brand: 'Pecify', price: 32990000, sale: 29990000 },
    ]},
  ];

  for (const { slug, items } of peripherals) {
    for (const p of items) await createProduct(slug, p);
    console.log(`✅ ${slug}: ${items.length}`);
  }

  console.log(`\n🎉 Curated catalog seeded: ${count} products`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
