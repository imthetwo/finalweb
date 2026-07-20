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
import {
  CancelOrderDto, CreateProductDto, UpdateOrderStatusDto, UpdateProductDto, UpdateUserRoleDto,
} from './dto/admin-product.dto';
import { CurrentUser } from '../auth/current-user.decorator';

type UploadedFileType = { buffer: Buffer; mimetype: string; size: number };

class ListAdminProductsQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

class ListAdminOrdersQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

class ListAdminUsersQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ── Dashboard — STAFF read-only, ADMIN full access ───────────────────────
  @Get('stats')
  @Roles(Role.ADMIN, Role.STAFF)
  stats() {
    return this.admin.stats();
  }

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
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: UploadedFileType) {
    return this.admin.uploadImage(file);
  }

  // ── Video upload → Cloudinary — ADMIN ONLY ───────────────────────────────
  @Post('upload-video')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadVideo(@UploadedFile() file: UploadedFileType) {
    return this.admin.uploadVideo(file);
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
  @UseInterceptors(FileInterceptor('file'))
  importProducts(
    @UploadedFile() file: UploadedFileType,
    @CurrentUser('role') role: Role,
  ) {
    return this.admin.importProductsExcel(file, role);
  }

  // ── Orders: STAFF views + updates shipping progress, ADMIN has full control ───

  @Get('orders')
  @Roles(Role.ADMIN, Role.STAFF)
  listOrders(@Query() query: ListAdminOrdersQueryDto) {
    return this.admin.listOrders(query);
  }

  // STAFF + ADMIN — routine shipping progress only (PENDING/PROCESSING/
  // SHIPPED/DELIVERED). CANCELLED is rejected here — see cancelOrder below.
  @Patch('orders/:id/status')
  @Roles(Role.ADMIN, Role.STAFF)
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.admin.updateOrderStatus(id, dto.status);
  }

  // STAFF + ADMIN — accepts an order awaiting confirmation into the normal
  // fulfillment pipeline (purely operational, like routine status progress).
  @Patch('orders/:id/accept')
  @Roles(Role.ADMIN, Role.STAFF)
  acceptOrder(
    @Param('id') id: string,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.admin.acceptOrder(id, actorId);
  }

  // ADMIN ONLY — rejects an order awaiting confirmation (e.g. real stock
  // doesn't match); refunds through MoMo first if it was actually paid.
  @Post('orders/:id/reject')
  @Roles(Role.ADMIN)
  rejectOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.admin.rejectOrder(id, dto.reason, actorId);
  }

  // ADMIN ONLY — cancel + restock, requires a reason (financial action)
  @Post('orders/:id/cancel')
  @Roles(Role.ADMIN)
  cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.admin.cancelOrder(id, dto.reason, actorId);
  }

  // ADMIN ONLY — force-recheck payment status directly against MoMo's query
  // API, for when the IPN webhook is delayed or lost (fixes the "customer
  // paid but order still shows Unpaid" desync without any auto-cancellation).
  @Post('orders/:id/recheck-payment')
  @Roles(Role.ADMIN)
  recheckPayment(@Param('id') id: string) {
    return this.admin.forcePollPayment(id);
  }

  // ADMIN ONLY — real MoMo refund for a paid order; only cancels + restocks
  // on a confirmed MoMo success (see PaymentsService.refundPayment)
  @Post('orders/:id/refund')
  @Roles(Role.ADMIN)
  refundOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.admin.refundOrder(id, dto.reason, actorId);
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

  // Inventory Report — No./Name/Price/Stock with low-stock highlighting
  @Get('products/inventory-report')
  @Roles(Role.ADMIN)
  async exportInventoryReport(@Res() res: Response) {
    const buffer = await this.admin.exportInventoryReport();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.xlsx"`);
    res.send(buffer);
  }

  // ── Users — ADMIN ONLY ────────────────────────────────────────────────────

  @Get('users')
  @Roles(Role.ADMIN)
  listUsers(@Query() query: ListAdminUsersQueryDto) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id/role')
  @Roles(Role.ADMIN)
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('userId') requesterId: string,
  ) {
    return this.admin.updateUserRole(id, dto.role, requesterId);
  }
}
