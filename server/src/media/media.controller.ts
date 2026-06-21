import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const LOCAL_IMAGES = path.join(process.cwd(), 'local_images');
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

@Controller('media')
export class MediaController {
  @Get(':folder/:file')
  serve(@Param('folder') folder: string, @Param('file') file: string, @Res() res: Response) {
    if (folder.includes('..') || file.includes('..') || file.includes('/') || file.includes('\\')) {
      throw new NotFoundException();
    }

    const filePath = path.join(LOCAL_IMAGES, folder, decodeURIComponent(file));
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  }
}
