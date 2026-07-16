import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dto/admin-product.dto';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminProductsService } from './services/admin-products.service';
import { AdminOrdersService } from './services/admin-orders.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PaymentsService } from '../payments/payments.service';

type UploadedFileLike = { buffer: Buffer; mimetype: string; size: number };

@Injectable()
export class AdminService {
  constructor(
    private readonly statsService: AdminStatsService,
    private readonly productsService: AdminProductsService,
    private readonly ordersService: AdminOrdersService,
    private readonly cloudinary: CloudinaryService,
    private readonly payments: PaymentsService,
  ) {}

  // ── Stats ─────────────────────────────────────────────────
  stats() { return this.statsService.getDashboardStats(); }

  // ── Products ──────────────────────────────────────────────
  uploadImage(file: UploadedFileLike) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('File must be an image');
    return this.productsService.uploadImage(file.buffer);
  }

  async uploadVideo(file: UploadedFileLike) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype.startsWith('video/')) throw new BadRequestException('File must be a video');
    if (file.size > 200 * 1024 * 1024) throw new BadRequestException('Video must be under 200MB');
    const url = await this.cloudinary.uploadVideo(file.buffer);
    return { url };
  }

  importProductsExcel(file: { buffer: Buffer }, role: Role) {
    if (!file) throw new BadRequestException('No file uploaded');
    // Staff import → created as draft, admin must approve before it publishes
    return this.productsService.importExcel(file.buffer, role === Role.STAFF);
  }

  exportProductTemplate() { return this.productsService.exportProductTemplate(); }
  listProducts(p: { search?: string; page?: number; limit?: number; categoryId?: string }) { return this.productsService.list(p); }
  // ADMIN → published immediately; STAFF → draft (isPublished: false), awaits admin approval
  createProduct(dto: CreateProductDto, role: Role) { return this.productsService.create(dto, role === Role.STAFF); }
  updateProduct(id: string, dto: UpdateProductDto) { return this.productsService.update(id, dto); }
  approveProduct(id: string) { return this.productsService.approve(id); }
  deleteProduct(id: string) { return this.productsService.remove(id); }
  exportProductsExcel() { return this.productsService.exportExcel(); }
  exportInventoryReport() { return this.productsService.exportInventoryReport(); }

  // ── Orders & Users ────────────────────────────────────────
  listOrders(p: { status?: string; page?: number; limit?: number }) { return this.ordersService.listOrders(p); }
  updateOrderStatus(orderId: string, status: string) { return this.ordersService.updateOrderStatus(orderId, status); }
  cancelOrder(orderId: string, reason: string, actorId: string) { return this.ordersService.cancelOrder(orderId, reason, actorId); }
  acceptOrder(orderId: string, actorId: string) { return this.ordersService.acceptOrder(orderId, actorId); }
  rejectOrder(orderId: string, reason: string, actorId: string) { return this.ordersService.rejectOrder(orderId, reason, actorId); }
  forcePollPayment(orderId: string) { return this.payments.forcePollPayment(orderId); }
  refundOrder(orderId: string, reason: string, actorId: string) { return this.payments.refundPayment(orderId, reason, actorId); }
  listUsers(p: { page?: number; limit?: number }) { return this.ordersService.listUsers(p); }
  updateUserRole(userId: string, role: Role, requesterId: string) { return this.ordersService.updateUserRole(userId, role, requesterId); }
  exportOrdersExcel() { return this.ordersService.exportOrdersExcel(); }
}
