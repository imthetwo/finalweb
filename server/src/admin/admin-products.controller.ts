import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateProductDto, UpdateProductDto } from './dto/admin-product.dto';
import { CurrentUser } from '../auth/current-user.decorator';

type UploadedFileType = { buffer: Buffer; mimetype: string; size: number };

// Multer buffers the whole upload into memory before any service-level check
// runs, so the size cap has to live here too — otherwise an oversized "image"
// or Excel file is fully read into memory regardless of what the service does.
const IMAGE_UPLOAD_LIMITS = { limits: { fileSize: 10 * 1024 * 1024 } }; // 10MB
const EXCEL_UPLOAD_LIMITS = { limits: { fileSize: 10 * 1024 * 1024 } }; // 10MB

class ListAdminProductsQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminProductsController {
  constructor(private readonly admin: AdminService) {}

  // ── Products: STAFF can only view + import (as draft) ────────────────────

  @Get('products')
  @Roles(Role.ADMIN, Role.STAFF)
  listProducts(@Query() query: ListAdminProductsQueryDto) {
    return this.admin.listProducts({
      search: query.search,
      page: query.page,
      limit: query.limit,
      categoryId: query.category,
    });
  }

  // ADMIN → published immediately; STAFF → draft (isPublished: false), awaits admin approval
  @Post('products')
  @Roles(Role.ADMIN, Role.STAFF)
  createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser('role') role: Role,
  ) {
    return this.admin.createProduct(dto, role);
  }

  // ADMIN ONLY — approve a product (set isPublished: true)
  @Patch('products/:id/approve')
  @Roles(Role.ADMIN)
  approveProduct(@Param('id') id: string) {
    return this.admin.approveProduct(id);
  }

  // ADMIN ONLY — edit a product
  @Patch('products/:id')
  @Roles(Role.ADMIN)
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.admin.updateProduct(id, dto);
  }

  // ADMIN ONLY — delete a product
  @Delete('products/:id')
  @Roles(Role.ADMIN)
  deleteProduct(@Param('id') id: string) {
    return this.admin.deleteProduct(id);
  }

  // ── Image upload — ADMIN ONLY ─────────────────────────────────────────────
  @Post('upload')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_LIMITS))
  uploadImage(@UploadedFile() file: UploadedFileType) {
    return this.admin.uploadImage(file);
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

  // ── Excel import — STAFF creates as draft (isPublished: false), ADMIN publishes immediately
  @Post('products/import')
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file', EXCEL_UPLOAD_LIMITS))
  importProducts(
    @UploadedFile() file: UploadedFileType,
    @CurrentUser('role') role: Role,
  ) {
    return this.admin.importProductsExcel(file, role);
  }

  // ── Exports — ADMIN ONLY ──────────────────────────────────────────────────

  @Get('products/export')
  @Roles(Role.ADMIN)
  async exportProducts(@Res() res: Response) {
    const buffer = await this.admin.exportProductsExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="products-catalog-${Date.now()}.xlsx"`);
    res.send(buffer);
  }

  // Inventory Report — No./Name/Price/Stock with low-stock highlighting
  @Get('products/inventory-report')
  @Roles(Role.ADMIN)
  async exportInventoryReport(@Res() res: Response) {
    const buffer = await this.admin.exportInventoryReport();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.xlsx"`);
    res.send(buffer);
  }
}
