/**
 * Create new products from sync-cloudinary.ts (renames/deletes already done)
 * Run: npx ts-node scripts/sync-new-products.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from './prisma-client';

const BASE = 'https://res.cloudinary.com/dxbvnueoq/image/upload/f_auto,q_auto,w_600/';
const url = (id: string) => BASE + id;

type NewProduct = {
  category: string; name: string; brand: string; imageUrl: string;
  price: number; costPrice: number; salePrice: number | null; stock: number;
  description: string; spec: Record<string, unknown> | null;
};

const NEW_PRODUCTS: NewProduct[] = [
  // CPU
  { category: 'Processors (CPU)', name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', imageUrl: url('TechStore/cpu/amd-ryzen-7-7800x3d'), price: 10990000, costPrice: 8500000, salePrice: null, stock: 14, description: 'AMD Ryzen 7 7800X3D, 8 nhân 16 luồng, boost 5.0GHz, 3D V-Cache 96MB, socket AM5, TDP 120W. CPU gaming tốt nhất tầm giá với 3D V-Cache độc quyền, hiệu năng game vượt trội đặc biệt ở game 1080p.', spec: { type: 'cpuSpec', socket: 'AM5', cores: 8, threads: 16, baseClockGhz: 4.5, boostClockGhz: 5.0, tdp: 120, cacheL3: '96MB', generation: 'Ryzen 7000' } },
  { category: 'Processors (CPU)', name: 'AMD Ryzen 7 7700', brand: 'AMD', imageUrl: url('TechStore/cpu/amd-ryzen-7-7700'), price: 6490000, costPrice: 4900000, salePrice: null, stock: 18, description: 'AMD Ryzen 7 7700, 8 nhân 16 luồng, boost 5.3GHz, cache L3 32MB, socket AM5, TDP 65W. Hiệu năng đa nhân mạnh trong TDP 65W, phù hợp build gaming/content creation hiệu quả điện năng.', spec: { type: 'cpuSpec', socket: 'AM5', cores: 8, threads: 16, baseClockGhz: 3.8, boostClockGhz: 5.3, tdp: 65, cacheL3: '32MB', generation: 'Ryzen 7000' } },
  { category: 'Processors (CPU)', name: 'AMD Ryzen 7 5700X', brand: 'AMD', imageUrl: url('TechStore/cpu/amd-ryzen-7-5700x'), price: 3990000, costPrice: 3000000, salePrice: null, stock: 22, description: 'AMD Ryzen 7 5700X, 8 nhân 16 luồng, boost 4.6GHz, cache L3 32MB, socket AM4, TDP 65W. CPU AM4 hiệu năng cao giá rẻ, lựa chọn upgrade tốt mà không cần đổi nền tảng.', spec: { type: 'cpuSpec', socket: 'AM4', cores: 8, threads: 16, baseClockGhz: 3.4, boostClockGhz: 4.6, tdp: 65, cacheL3: '32MB', generation: 'Ryzen 5000' } },
  { category: 'Processors (CPU)', name: 'AMD Ryzen 5 5600', brand: 'AMD', imageUrl: url('TechStore/cpu/amd-ryzen-5-5600'), price: 2490000, costPrice: 1900000, salePrice: null, stock: 30, description: 'AMD Ryzen 5 5600, 6 nhân 12 luồng, boost 4.4GHz, cache L3 32MB, socket AM4, TDP 65W. CPU gaming tầm trung cực phổ biến AM4, giá tốt hiệu năng cao cho build gaming cơ bản.', spec: { type: 'cpuSpec', socket: 'AM4', cores: 6, threads: 12, baseClockGhz: 3.5, boostClockGhz: 4.4, tdp: 65, cacheL3: '32MB', generation: 'Ryzen 5000' } },
  { category: 'Processors (CPU)', name: 'AMD Ryzen 5 5600GT', brand: 'AMD', imageUrl: url('TechStore/cpu/amd-ryzen-5-5600gt'), price: 2890000, costPrice: 2200000, salePrice: null, stock: 20, description: 'AMD Ryzen 5 5600GT, 6 nhân 12 luồng, boost 4.6GHz, tích hợp Radeon 7 Graphics, socket AM4, TDP 65W. CPU AM4 có iGPU mạnh nhất 5000G, chạy không cần GPU rời.', spec: { type: 'cpuSpec', socket: 'AM4', cores: 6, threads: 12, baseClockGhz: 3.6, boostClockGhz: 4.6, tdp: 65, cacheL3: '16MB', generation: 'Ryzen 5000G' } },
  { category: 'Processors (CPU)', name: 'AMD Ryzen 9 7950X', brand: 'AMD', imageUrl: url('TechStore/cpu/amd-ryzen-9-7950x'), price: 17990000, costPrice: 13800000, salePrice: 16490000, stock: 6, description: 'AMD Ryzen 9 7950X, 16 nhân 32 luồng, boost 5.7GHz, cache L3 64MB, socket AM5, TDP 170W. Flagship workstation AM5, hiệu năng đa nhân đỉnh cho 3D rendering, video editing 8K.', spec: { type: 'cpuSpec', socket: 'AM5', cores: 16, threads: 32, baseClockGhz: 4.5, boostClockGhz: 5.7, tdp: 170, cacheL3: '64MB', generation: 'Ryzen 7000' } },
  // GPU
  { category: 'Graphics Cards (GPU)', name: 'Gigabyte GeForce RTX 3060 Gaming OC 8G', brand: 'Gigabyte', imageUrl: url('TechStore/gpu/gigabyte-rtx3060-gaming-oc-8g'), price: 7490000, costPrice: 5700000, salePrice: null, stock: 12, description: 'Gigabyte GeForce RTX 3060 Gaming OC 8G, WINDFORCE 3X, boost 1837MHz, 8GB GDDR6 128-bit. Card gaming 1080p giá tốt, DLSS 2, Ray Tracing, phù hợp game AAA 1080p.', spec: { type: 'gpuSpec', vramGb: 8, memType: 'GDDR6', boostClockMhz: 1837, tdp: 170, pcieGen: 4 } },
  { category: 'Graphics Cards (GPU)', name: 'Gigabyte GeForce RTX 3060 Windforce OC 12G', brand: 'Gigabyte', imageUrl: url('TechStore/gpu/gigabyte-rtx3060-windforce-oc-12g'), price: 8490000, costPrice: 6500000, salePrice: null, stock: 10, description: 'Gigabyte GeForce RTX 3060 Windforce OC 12G, WINDFORCE 3X, boost 1837MHz, 12GB GDDR6 192-bit. VRAM 12GB lớn cho AI/stable diffusion và 1440p gaming.', spec: { type: 'gpuSpec', vramGb: 12, memType: 'GDDR6', boostClockMhz: 1837, tdp: 170, pcieGen: 4 } },
  { category: 'Graphics Cards (GPU)', name: 'Inno3D GeForce RTX 3080 iChill X4 LHR', brand: 'Inno3D', imageUrl: url('TechStore/gpu/inno3d-rtx3080-ichill-x4'), price: 14990000, costPrice: 11500000, salePrice: 13490000, stock: 5, description: 'Inno3D GeForce RTX 3080 iChill X4 LHR, 10GB GDDR6X 320-bit, 4 fan iChill, boost 1755MHz. Card gaming 4K hiệu năng cao, DLSS 2 + Ray Tracing.', spec: { type: 'gpuSpec', vramGb: 10, memType: 'GDDR6X', boostClockMhz: 1755, tdp: 350, pcieGen: 4 } },
  { category: 'Graphics Cards (GPU)', name: 'ASRock Radeon RX 7900 XTX Taichi White 24GB OC', brand: 'ASRock', imageUrl: url('TechStore/gpu/asrock-rx7900xtx-taichi-white'), price: 17990000, costPrice: 13800000, salePrice: null, stock: 4, description: 'ASRock Radeon RX 7900 XTX Taichi White 24GB OC, 24GB GDDR6 384-bit, thiết kế trắng Taichi premium. Card AMD flagship 4K, Displayport 2.1, FSR 3, lý tưởng cho setup trắng.', spec: { type: 'gpuSpec', vramGb: 24, memType: 'GDDR6', boostClockMhz: 2565, tdp: 355, pcieGen: 4 } },
  { category: 'Graphics Cards (GPU)', name: 'ASRock Radeon RX 9070 XT Challenger 16GB', brand: 'ASRock', imageUrl: url('TechStore/gpu/asrock-rx9070xt-challenger'), price: 11490000, costPrice: 8800000, salePrice: null, stock: 8, description: 'ASRock Radeon RX 9070 XT Challenger 16GB GDDR6, PCIe 5.0, DisplayPort 2.1. RDNA 4 gaming 1440p/4K, FSR 4, hiệu năng vượt RTX 4070 Super.', spec: { type: 'gpuSpec', vramGb: 16, memType: 'GDDR6', boostClockMhz: 2970, tdp: 304, pcieGen: 5 } },
  { category: 'Graphics Cards (GPU)', name: 'ASRock Radeon RX 9070 XT Steel Legend Dark 16GB', brand: 'ASRock', imageUrl: url('TechStore/gpu/asrock-rx9070xt-steel-legend-dark'), price: 11990000, costPrice: 9200000, salePrice: null, stock: 7, description: 'ASRock Radeon RX 9070 XT Steel Legend Dark 16GB GDDR6, thiết kế dark premium, PCIe 5.0. RDNA 4 gaming 1440p/4K, RGB sync, FSR 4, phù hợp setup dark theme.', spec: { type: 'gpuSpec', vramGb: 16, memType: 'GDDR6', boostClockMhz: 2970, tdp: 304, pcieGen: 5 } },
  // Storage
  { category: 'Storage (SSD/HDD)', name: 'Samsung 9100 PRO NVMe M.2 SSD 4TB', brand: 'Samsung', imageUrl: url('TechStore/storage/samsung-9100-pro-4tb'), price: 8990000, costPrice: 6900000, salePrice: null, stock: 8, description: 'Samsung 9100 PRO NVMe M.2 SSD 4TB, PCIe 5.0 x4, đọc 14,800 MB/s, ghi 13,400 MB/s. SSD gen 5 flagship dung lượng lớn, hiệu năng đỉnh cho workstation.', spec: { type: 'storageSpec', capacityGb: 4096, storageType: 'NVMe SSD', interfaceType: 'PCIe 5.0 x4', readMbps: 14800, writeMbps: 13400 } },
  { category: 'Storage (SSD/HDD)', name: 'Samsung 970 Evo Plus NVMe M.2 SSD 2TB', brand: 'Samsung', imageUrl: url('TechStore/storage/samsung-970-evo-plus'), price: 2990000, costPrice: 2300000, salePrice: null, stock: 20, description: 'Samsung 970 Evo Plus NVMe M.2 SSD 2TB, PCIe 3.0 x4, đọc 3,500 MB/s, ghi 3,300 MB/s. SSD NVMe bền bỉ giá tốt cho ổ cài game hoặc ổ phụ.', spec: { type: 'storageSpec', capacityGb: 2048, storageType: 'NVMe SSD', interfaceType: 'PCIe 3.0 x4', readMbps: 3500, writeMbps: 3300 } },
  // PSU
  { category: 'Power Supplies', name: 'Corsair RM750x Shift 750W 80+ Gold', brand: 'Corsair', imageUrl: url('TechStore/power-supply/corsair-rm750x-shift'), price: 3290000, costPrice: 2500000, salePrice: null, stock: 18, description: 'Corsair RM750x Shift 750W 80+ Gold, connector dọc cạnh (Shift), fully modular, quạt 135mm Zero RPM, ATX 3.0 + PCIe 5.0. Nguồn cao cấp dễ quản lý dây.', spec: null },
  // Laptops
  { category: 'Laptops', name: 'ASUS TUF Gaming F15 2024', brand: 'ASUS', imageUrl: url('TechStore/laptops/asus-tuf-gaming-f15'), price: 24990000, costPrice: 19500000, salePrice: null, stock: 10, description: 'ASUS TUF Gaming F15 2024, Intel Core i7-13700H, RTX 4060 8GB, RAM 16GB DDR5, SSD 512GB, màn 15.6" FHD 144Hz. Laptop gaming bền bỉ MIL-SPEC, tản nhiệt hiệu quả.', spec: null },
  { category: 'Laptops', name: 'Acer Predator Helios Neo 16 MacanS RTX 4070', brand: 'Acer', imageUrl: url('TechStore/laptops/acer-predator-helios-neo-16-macan'), price: 42990000, costPrice: 33500000, salePrice: null, stock: 5, description: 'Acer Predator Helios Neo 16 (PHN16-72), Intel Core Ultra 9 275HX, RTX 4070 8GB 140W, RAM 32GB DDR5, SSD 1TB, màn 16" WQXGA 165Hz. Laptop gaming flagship.', spec: null },
  { category: 'Laptops', name: 'Acer Predator Triton 14 OLED RTX 4060', brand: 'Acer', imageUrl: url('TechStore/laptops/acer-predator-triton-14'), price: 38990000, costPrice: 30500000, salePrice: null, stock: 4, description: 'Acer Predator Triton 14 (PT14-51), Intel Core i7-13700H, RTX 4060 8GB, RAM 16GB DDR5, màn 14" WQXGA OLED 120Hz. Laptop gaming cao cấp mỏng nhẹ OLED sắc nét.', spec: null },
  { category: 'Laptops', name: 'Acer Nitro 17 RTX 4060 AN17-42', brand: 'Acer', imageUrl: url('TechStore/laptops/acer-nitro-17-an17-42'), price: 27990000, costPrice: 21800000, salePrice: null, stock: 8, description: 'Acer Nitro 17 (AN17-42), AMD Ryzen 7 8745H, RTX 4060 8GB, RAM 16GB DDR5, SSD 512GB, màn 17.3" FHD 165Hz. Laptop gaming AMD 17 inch tầm trung giá hợp lý.', spec: null },
];

// Image updates for existing products (using renamed TechStore paths)
const IMAGE_UPDATES: Record<string, string> = {
  'Intel Core Ultra 5 245K': url('TechStore/cpu/intel-core-ultra-5-245k'),
  'Intel Core i5-14600K': url('TechStore/cpu/intel-core-i5-14600k'),
  'MSI MAG Z890 TOMAHAWK WIFI': url('TechStore/motherboard/msi-mag-z890-tomahawk-wifi'),
  'ASRock B650M PG Riptide': url('TechStore/motherboard/asrock-b650m-pg-riptide'),
  'MSI PRO A620M-E': url('TechStore/motherboard/msi-pro-a620m-e'),
  'MSI PRO B760M-A WIFI DDR4': url('TechStore/motherboard/msi-pro-b760m-a-wifi-ddr4'),
  'MSI B760M Gaming Plus WIFI DDR4': url('TechStore/motherboard/msi-b760m-gaming-plus-ddr4'),
  'Samsung 9100 PRO NVMe M.2 SSD 2TB': url('TechStore/storage/samsung-9100-pro-2tb'),
  'Samsung 990 EVO Plus NVMe M.2 SSD 2TB': url('TechStore/storage/samsung-990-evo'),
  'Samsung 980 PRO NVMe M.2 SSD 2TB': url('TechStore/storage/samsung-980-pro'),
  'Samsung 990 PRO NVMe M.2 SSD 2TB': url('TechStore/storage/samsung-990-pro'),
  'Samsung T9 Portable SSD 4TB': url('TechStore/storage/samsung-t9-portable'),
  'Kingston Fury Beast DDR5 16GB 5200MHz': url('TechStore/memory/kingston-fury-beast-rgb-ddr4'),
  'Kingston Fury Beast DDR4 16GB 3600MHz': url('TechStore/memory/kingston-fury-beast-black-ddr4'),
  'Corsair Vengeance RGB DDR5 32GB 6000MHz': url('TechStore/memory/corsair-dominator-rgb-ddr5'),
  'G.Skill Ripjaws V DDR4 32GB 3200MHz': url('TechStore/memory/gskill-ripjaws-v-ddr4'),
  'Crucial Pro DDR5 32GB 5600MHz': url('TechStore/memory/crucial-pro-ddr5'),
  'Acer Predator Helios Neo 16 RTX 4070 Ti': url('TechStore/laptops/acer-predator-helios-neo-16'),
  'Acer Predator Helios 3D 15 SpatialLabs RTX 4090': url('TechStore/laptops/acer-predator-helios-3d-15'),
  'Acer Predator Triton 14 AI RTX 4060 OLED': url('TechStore/laptops/acer-predator-triton-14-ai'),
  'Acer Nitro 17 RTX 4060 Gaming': url('TechStore/laptops/acer-nitro-17'),
  'Acer Predator Helios Neo 18 RTX 4080': url('TechStore/laptops/acer-predator-helios-neo-18'),
  'Acer Predator Triton 16 OLED RTX 4060': url('TechStore/laptops/acer-predator-triton-16'),
  'Acer Predator Helios 14 AI OLED RTX 4060': url('TechStore/laptops/acer-predator-helios-14-ai'),
  'Acer Predator Triton 17X RTX 4080': url('TechStore/laptops/acer-predator-triton-17x'),
};

async function main() {
  // Update existing products
  console.log('✏️  Updating existing product images...');
  for (const [name, imageUrl] of Object.entries(IMAGE_UPDATES)) {
    const p = await prisma.product.findFirst({ where: { name } });
    if (p) {
      await prisma.product.update({ where: { id: p.id }, data: { imageUrl } });
      console.log(`  ✅ ${name}`);
    }
  }

  // Create new products
  console.log('\n🆕 Creating new products...');
  for (const p of NEW_PRODUCTS) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } });
    if (exists) { console.log(`  ⏭️  skip (exists): ${p.name}`); continue; }
    const category = await prisma.category.findFirst({ where: { name: p.category } });
    if (!category) { console.warn(`  ⚠️  missing category: ${p.category}`); continue; }
    const specRelation: Record<string, unknown> = {};
    if (p.spec) {
      const { type, ...fields } = p.spec;
      specRelation[type as string] = { create: fields };
    }
    await prisma.product.create({
      data: { categoryId: category.id, name: p.name, brand: p.brand, imageUrl: p.imageUrl, price: p.price, costPrice: p.costPrice, salePrice: p.salePrice, stock: p.stock, isPublished: true, description: p.description, ...specRelation },
    });
    console.log(`  ✅ created: ${p.name}`);
  }

  // Sync products.json
  const dataFile = path.join(__dirname, '..', 'data', 'products.json');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  data.products = data.products.map((p: any) => IMAGE_UPDATES[p.name] ? { ...p, imageUrl: IMAGE_UPDATES[p.name] } : p);
  for (const np of NEW_PRODUCTS) {
    if (!data.products.find((p: any) => p.name === np.name)) data.products.push({ ...np, isPublished: true });
  }
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n📁 products.json: ${data.products.length} total products`);
  console.log('🎉 Done!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
