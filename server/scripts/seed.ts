/* eslint-disable */
// @ts-nocheck
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config'; 

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const LOCAL_IMAGES_DIR = path.join(__dirname, '..', 'local_images');

async function uploadImagesToCloudinary() {
  try {
    const folders = fs.readdirSync(LOCAL_IMAGES_DIR);

    for (const folder of folders) {
      const folderPath = path.join(LOCAL_IMAGES_DIR, folder);
      
      if (fs.statSync(folderPath).isDirectory()) {
        console.log(`\n📂 Đang quét thư mục: ${folder}...`);
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
          const filePath = path.join(folderPath, file);
          
          console.log(`⏳ Đang upload: ${file}...`);
          
          const result = await cloudinary.uploader.upload(filePath, {
            folder: `TechStore/${folder}`,
            use_filename: true,
            unique_filename: false,
          });

          console.log(`✅ Upload thành công! Link URL: ${result.secure_url}`);
        }
      }
    }
    console.log('\n🎉 HOÀN TẤT UPLOAD TOÀN BỘ ẢNH!');
  } catch (error) {
    console.error('❌ Lỗi Upload:', error);
  }
}

// Bắt lỗi promise (Giải quyết cái cảnh báo vàng cuối cùng của mày)
uploadImagesToCloudinary().catch((err) => console.error(err));