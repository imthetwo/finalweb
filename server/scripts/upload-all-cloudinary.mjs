// Upload TẤT CẢ local_images → Cloudinary (TechStore/{folder}/{name}).
// Idempotent: overwrite ảnh đã có. Chạy: node scripts/upload-all-cloudinary.mjs
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DIR = path.join(__dirname, '..', 'local_images');
const IMG = /\.(png|jpe?g|webp|gif)$/i;

let ok = 0, fail = 0;
for (const folder of fs.readdirSync(DIR)) {
  const fp = path.join(DIR, folder);
  if (!fs.statSync(fp).isDirectory()) continue;
  const files = fs.readdirSync(fp).filter((f) => IMG.test(f));
  process.stdout.write(`\n📂 ${folder} (${files.length}) `);
  for (const file of files) {
    try {
      await cloudinary.uploader.upload(path.join(fp, file), {
        folder: `TechStore/${folder}`,
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      });
      ok++; process.stdout.write('.');
    } catch (e) {
      fail++; process.stdout.write('x');
    }
  }
}
console.log(`\n\n🎉 Done. Uploaded OK: ${ok}, Fail: ${fail}`);
