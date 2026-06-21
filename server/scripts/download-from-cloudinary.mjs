// Tải toàn bộ ảnh từ Cloudinary (TechStore/*) về tái tạo server/local_images/{folder}/{file}.
// Dùng khi local_images bị xóa nhưng ảnh còn trên Cloudinary.
// Chạy: node scripts/download-from-cloudinary.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'local_images');

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SEC = process.env.CLOUDINARY_API_SECRET;
const AUTH = 'Basic ' + Buffer.from(`${KEY}:${SEC}`).toString('base64');

// Liệt kê tất cả resource dưới prefix TechStore/ (có phân trang)
async function listAll() {
  const items = [];
  let cursor = null;
  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD}/resources/image`);
    url.searchParams.set('type', 'upload');
    url.searchParams.set('prefix', 'TechStore/');
    url.searchParams.set('max_results', '500');
    if (cursor) url.searchParams.set('next_cursor', cursor);
    const res = await fetch(url, { headers: { Authorization: AUTH } });
    const data = await res.json();
    for (const r of data.resources ?? []) items.push(r);
    cursor = data.next_cursor;
  } while (cursor);
  return items;
}

async function main() {
  console.log('📥 Đang lấy danh sách ảnh từ Cloudinary…');
  const all = await listAll();
  console.log(`Tìm thấy ${all.length} ảnh.\n`);

  let ok = 0, fail = 0;
  for (const r of all) {
    // public_id = TechStore/{folder}/{name}  →  local_images/{folder}/{name}.{format}
    const rel = r.public_id.replace(/^TechStore\//, '');
    const dir = path.join(OUT, path.dirname(rel));
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(OUT, `${rel}.${r.format}`);
    try {
      const img = await fetch(r.secure_url);
      const buf = Buffer.from(await img.arrayBuffer());
      fs.writeFileSync(dest, buf);
      ok++; process.stdout.write('.');
    } catch {
      fail++; process.stdout.write('x');
    }
  }
  console.log(`\n\n🎉 Done. Tải về ${ok} ảnh (lỗi ${fail}) → server/local_images/`);
  console.log('⚠️  Lưu ý: storage & laptops không có trên Cloudinary nên không tải về được.');
}

main().catch((e) => { console.error(e); process.exit(1); });
