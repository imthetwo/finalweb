import {
  BadRequestException,
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateProductDto, UpdateOrderStatusDto, UpdateProductDto,
} from './dto/admin-product.dto';

type UploadedFileType = { buffer: Buffer; mimetype: string; size: number };

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ── Dashboard ──
  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  // ── Products CRUD ──
  @Get('products')
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

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.admin.createProduct(dto);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.admin.updateProduct(id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.admin.deleteProduct(id);
  }

  // ── Image upload → Cloudinary ──
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: UploadedFileType) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('File must be an image');
    return this.admin.uploadImage(file.buffer);
  }

  // ── Bulk import products from Excel ──
  @Post('products/import')
  @UseInterceptors(FileInterceptor('file'))
  importProducts(@UploadedFile() file: UploadedFileType) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.admin.importProductsExcel(file.buffer);
  }

  // ── Orders ──
  @Get('orders')
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

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.admin.updateOrderStatus(id, dto.status);
  }

  // ── Excel export (báo cáo đơn hàng) ──
  @Get('orders/export')
  async exportOrders(@Res() res: Response) {
    const buffer = await this.admin.exportOrdersExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="orders-report-${Date.now()}.xlsx"`);
    res.send(buffer);
  }

  // ── Excel export (danh mục sản phẩm theo loại) ──
  @Get('products/export')
  async exportProducts(@Res() res: Response) {
    const buffer = await this.admin.exportProductsExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="products-catalog-${Date.now()}.xlsx"`);
    res.send(buffer);
  }

  // ── Users ──
  @Get('users')
  listUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.admin.listUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

}
