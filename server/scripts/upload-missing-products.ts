import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import https from 'https';
import { prisma } from './prisma-client';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME!;

function download(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120', 'Referer': 'https://cellphones.com.vn/' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) { download(res.headers.location!).then(resolve).catch(reject); return; }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
      const c: Buffer[] = [];
      res.on('data', (d: Buffer) => c.push(d));
      res.on('end', () => resolve(Buffer.concat(c)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function upload(buf: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const s = cloudinary.uploader.upload_stream({ public_id: publicId, overwrite: true, resource_type: 'image' }, (err, r) => {
      if (err || !r) { reject(err); return; }
      resolve(`https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_600/${publicId}`);
    });
    s.end(buf);
  });
}

type Item = { name: string; brand: string; price: number; salePrice?: number; stock: number; imageUrl: string; publicId: string; catName: string; specs?: Record<string, unknown> };

const ITEMS: Item[] = [
  // ── AMD CPU ──────────────────────────────────────────────────────────────────
  {
    name: 'AMD Ryzen 7 9800X3D', brand: 'AMD', price: 13490000, stock: 12,
    catName: 'Processors (CPU)',
    imageUrl: 'https://cdn2.cellphones.com.vn/x/media/catalog/product/c/p/cpu-amd-ryzen-7-9800x3d_1_.png',
    publicId: 'TechStore/cpu/amd-ryzen-7-9800x3d',
    specs: { socket: 'AM5', cores: 8, threads: 16, baseClockGhz: 4.7, boostClockGhz: 5.2, tdp: 120 },
  },
  {
    name: 'AMD Ryzen 9 9950X', brand: 'AMD', price: 15990000, stock: 8,
    catName: 'Processors (CPU)',
    imageUrl: 'https://cdn2.cellphones.com.vn/x/media/catalog/product/g/r/group_251_2_1.png',
    publicId: 'TechStore/cpu/amd-ryzen-9-9950x',
    specs: { socket: 'AM5', cores: 16, threads: 32, baseClockGhz: 4.3, boostClockGhz: 5.7, tdp: 170 },
  },
  {
    name: 'AMD Ryzen 7 9700X', brand: 'AMD', price: 8490000, stock: 20,
    catName: 'Processors (CPU)',
    imageUrl: 'https://cdn2.cellphones.com.vn/x/media/catalog/product/g/r/group_251_2__1.png',
    publicId: 'TechStore/cpu/amd-ryzen-7-9700x',
    specs: { socket: 'AM5', cores: 8, threads: 16, baseClockGhz: 3.8, boostClockGhz: 5.5, tdp: 65 },
  },
  {
    name: 'AMD Ryzen 5 9600X', brand: 'AMD', price: 6490000, stock: 30,
    catName: 'Processors (CPU)',
    imageUrl: 'https://cdn2.cellphones.com.vn/x/media/catalog/product/g/r/group_251_3__1.png',
    publicId: 'TechStore/cpu/amd-ryzen-5-9600x',
    specs: { socket: 'AM5', cores: 6, threads: 12, baseClockGhz: 3.9, boostClockGhz: 5.4, tdp: 65 },
  },

  // ── GPU mid-range (từ pcmarket.vn) ───────────────────────────────────────────
  {
    name: 'ASRock Radeon RX 7800 XT Phantom Gaming OC', brand: 'ASRock', price: 10990000, stock: 15,
    catName: 'Graphics Cards (GPU)',
    imageUrl: 'https://pcmarket.vn/media/product/250_12105_radeon_rx_7800_xt_phantom_gaming_16gb_oc_1.png',
    publicId: 'TechStore/gpu/asrock-rx7800xt-phantom',
    specs: { vramGb: 16, tdp: 263, memType: 'GDDR6', pcieGen: 4 },
  },
];

async function main() {
  console.log('🚀 Uploading missing product images...\n');

  for (const item of ITEMS) {
    console.log(`📦 ${item.name}`);
    try {
      const buf = await download(item.imageUrl);
      console.log(`   ⬇️  ${(buf.length / 1024).toFixed(0)}KB downloaded`);
      const finalUrl = await upload(buf, item.publicId);
      console.log(`   ☁️  Uploaded → ${item.publicId.split('/').pop()}`);

      const cat = await prisma.category.findFirst({ where: { name: item.catName } });
      if (!cat) { console.log(`   ❌ Category not found: ${item.catName}\n`); continue; }

      const existing = await prisma.product.findFirst({ where: { name: item.name } });
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data: { imageUrl: finalUrl } });
        console.log(`   💾 DB updated\n`);
      } else {
        await prisma.product.create({
          data: {
            categoryId: cat.id,
            name: item.name,
            brand: item.brand,
            price: item.price,
            salePrice: item.salePrice ?? null,
            stock: item.stock,
            isPublished: true,
            imageUrl: finalUrl,
          },
        });
        console.log(`   💾 Created in DB\n`);
      }
    } catch (e) {
      console.log(`   ❌ ${(e as Error).message}\n`);
    }
  }

  const total = await prisma.product.count();
  console.log(`✅ Done! Total products: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
