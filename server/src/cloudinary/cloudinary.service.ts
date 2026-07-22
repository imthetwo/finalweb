import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private configured = false;

  constructor() {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      this.configured = true;
    }
  }

  private upload(buffer: Buffer, folder: string, resourceType: 'image' | 'video', publicId?: string): Promise<string> {
    if (!this.configured) return Promise.reject(new Error('Cloudinary is not configured'));
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType, ...(publicId ? { public_id: publicId, overwrite: true } : {}) },
        (err, result) => {
          if (err || !result) {
            this.logger.error(`Cloudinary upload failed: ${err?.message}`);
            return reject(err ?? new Error('Upload failed'));
          }
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }

  uploadImage(buffer: Buffer, folder = 'TechStore/uploads', publicId?: string): Promise<string> {
    if (!this.configured) return Promise.reject(new Error('Cloudinary is not configured'));
    return this.upload(buffer, folder, 'image', publicId);
  }
}
