/**
 * Upload official brand images to Cloudinary under correct folders.
 * Sources: manufacturer official CDNs only (Samsung, Razer, ASUS, MSI).
 * Run: npx ts-node scripts/upload-official-images.ts
 */
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Official manufacturer image URLs → Cloudinary public_id
const UPLOADS: { url: string; publicId: string; name: string }[] = [
  // ── STORAGE — Samsung Official CDN ──────────────────────────────────────────
  {
    url: 'https://images.samsung.com/is/image/samsung/p6pim/global/mz-v9p2t0bw/gallery/global-990-pro-mz-v9p2t0bw-thumb-534726127',
    publicId: 'TechStore/storage/samsung-990-pro-nvme-2tb',
    name: 'Samsung 990 PRO NVMe 2TB',
  },
  {
    url: 'https://images.samsung.com/is/image/samsung/p6pim/global/mz-v9s2t0bw/gallery/global-990-evo-plus-mz-v9s2t0bw-thumb-544161194',
    publicId: 'TechStore/storage/samsung-990-evo-plus-nvme-2tb',
    name: 'Samsung 990 EVO Plus NVMe 2TB',
  },
  {
    url: 'https://images.samsung.com/is/image/samsung/p6pim/global/mz-77e2t0bw/gallery/global-870-evo-mz-77e2t0bw-thumb-551145127',
    publicId: 'TechStore/storage/samsung-870-evo-sata-2tb',
    name: 'Samsung 870 EVO SATA 2TB',
  },
  {
    url: 'https://images.samsung.com/is/image/samsung/p6pim/global/mu-pd4t0s-ww/gallery/global-t9-portable-ssd-mu-pd4t0s-ww-thumb-549696538',
    publicId: 'TechStore/storage/samsung-t9-portable-ssd-4tb',
    name: 'Samsung T9 Portable SSD 4TB',
  },

  // ── LAPTOPS — Official Brand CDNs ────────────────────────────────────────────
  {
    url: 'https://dl.razerzone.com/src2/6559/6559-1-en-v3.png',
    publicId: 'TechStore/laptops/razer-blade-16-2024',
    name: 'Razer Blade 16 (2024)',
  },
  {
    url: 'https://dl.razerzone.com/src2/6558/6558-1-en-v1.png',
    publicId: 'TechStore/laptops/razer-blade-14-2024',
    name: 'Razer Blade 14 (2024)',
  },
  {
    url: 'https://dlcdnwebimgs.asus.com/gain/0E20FAB3-9DEE-4B77-A857-5C77E88F7EB5/w800/h600',
    publicId: 'TechStore/laptops/asus-rog-zephyrus-g16-rtx4080',
    name: 'ASUS ROG Zephyrus G16 RTX 4080',
  },
  {
    url: 'https://storage-asset.msi.com/global/picture/image/feature/nb/Stealth-16-AI-Studio-A1V/A1VHG/keyfeature/stealth16-AI-studio-gallery01.jpg',
    publicId: 'TechStore/laptops/msi-stealth-16-ai-studio',
    name: 'MSI Stealth 16 AI Studio',
  },
];

async function main() {
  console.log(`\n📤 Uploading ${UPLOADS.length} official images to Cloudinary...\n`);

  const results: { name: string; publicId: string; url: string; status: string }[] = [];

  for (const item of UPLOADS) {
    try {
      const result = await cloudinary.uploader.upload(item.url, {
        public_id:     item.publicId,
        overwrite:     false,   // skip if already exists
        resource_type: 'image',
        timeout:       30000,
      });
      const secureUrl = result.secure_url;
      results.push({ name: item.name, publicId: item.publicId, url: secureUrl, status: '✅' });
      console.log(`✅ ${item.name}`);
      console.log(`   → ${secureUrl}\n`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      results.push({ name: item.name, publicId: item.publicId, url: '', status: `❌ ${msg}` });
      console.error(`❌ ${item.name}: ${msg}\n`);
    }
  }

  console.log('\n── SUMMARY ──────────────────────────────────────────────');
  results.forEach(r => console.log(`${r.status} ${r.name}`));
  console.log('\nUpdate products.json with the Cloudinary URLs above.');
  console.log('Then run: npx ts-node scripts/seed-clean-catalog.ts\n');
}

main().catch(console.error);
