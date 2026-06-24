import {
  BadRequestException,
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UploadedFile,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateProductDto, UpdateOrderStatusDto, UpdateProductDto,
} from './dto/admin-product.dto';

type UploadedFileType = { buffer: Buffer; mimetype: string; size: number };

// Helper để lấy role từ request (sau JwtAuthGuard)
function getRole(req: Request & { user?: { role?: Role } }): Role | undefined {
  return req.user?.role;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ── Dashboard — STAFF chỉ xem, ADMIN đầy đủ ──────────────────────────────
  @Get('stats')
  @Roles(Role.ADMIN, Role.STAFF)
  stats() {
    return this.admin.stats();
  }

  // ── Products: STAFF chỉ được xem + import (draft) ────────────────────────

  @Get('products')
  @Roles(Role.ADMIN, Role.STAFF)
  listProducts(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    return this.admin.listProducts({
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      categoryId: category,
    });
  }

  // ADMIN ONLY — tạo sản phẩm trực tiếp (published)
  @Post('products')
  @Roles(Role.ADMIN)
  createProduct(@Body() dto: CreateProductDto) {
    return this.admin.createProduct(dto);
  }

  // ADMIN ONLY — chỉnh sửa sản phẩm
  @Patch('products/:id')
  @Roles(Role.ADMIN)
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.admin.updateProduct(id, dto);
  }

  // ADMIN ONLY — xóa sản phẩm
  @Delete('products/:id')
  @Roles(Role.ADMIN)
  deleteProduct(@Param('id') id: string) {
    return this.admin.deleteProduct(id);
  }

  // ── Image upload — ADMIN ONLY ─────────────────────────────────────────────
  @Post('upload')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: UploadedFileType) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('File must be an image');
    return this.admin.uploadImage(file.buffer);
  }

  // ── Video upload → Cloudinary — ADMIN ONLY ───────────────────────────────
  @Post('upload-video')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: UploadedFileType) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype.startsWith('video/')) throw new BadRequestException('File must be a video');
    if (file.size > 200 * 1024 * 1024) throw new BadRequestException('Video must be under 200MB');
    const url = await this.admin.uploadVideo(file.buffer);
    return { url };
  }

  // ── Excel template — STAFF + ADMIN ───────────────────────────────────────
  @Get('products/template')
  @Roles(Role.ADMIN, Role.STAFF)
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.admin.exportProductTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.xlsx"');
    res.end(buffer);
  }

  // ── Excel import — STAFF tạo draft (isPublished: false), ADMIN publish ngay
  @Post('products/import')
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file'))
  importProducts(
    @UploadedFile() file: UploadedFileType,
    @Req() req: Request & { user?: { role?: Role } },
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    // Staff import → tạo draft, admin phải duyệt trước khi publish
    const asDraft = getRole(req) === Role.STAFF;
    return this.admin.importProductsExcel(file.buffer, asDraft);
  }

  // ── Orders: STAFF xem, ADMIN cập nhật trạng thái ─────────────────────────

  @Get('orders')
  @Roles(Role.ADMIN, Role.STAFF)
  listOrders(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listOrders({
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // ADMIN ONLY — đổi trạng thái đơn hàng
  @Patch('orders/:id/status')
  @Roles(Role.ADMIN)
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.admin.updateOrderStatus(id, dto.status);
  }

  // ── Exports — ADMIN ONLY ──────────────────────────────────────────────────

  @Get('orders/export')
  @Roles(Role.ADMIN)
  async exportOrders(@Res() res: Response) {
    const buffer = await this.admin.exportOrdersExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="orders-report-${Date.now()}.xlsx"`);
    res.send(buffer);
  }

  @Get('products/export')
  @Roles(Role.ADMIN)
  async exportProducts(@Res() res: Response) {
    const buffer = await this.admin.exportProductsExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="products-catalog-${Date.now()}.xlsx"`);
    res.send(buffer);
  }

  // ── Users — ADMIN ONLY ────────────────────────────────────────────────────

  @Get('users')
  @Roles(Role.ADMIN)
  listUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.admin.listUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
