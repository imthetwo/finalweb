import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dto/admin-product.dto';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminProductsCrudService } from './services/admin-products-crud.service';
import { AdminProductsExportService } from './services/admin-products-export.service';
import { AdminOrdersService } from './services/admin-orders.service';
import { AdminOrdersExportService } from './services/admin-orders-export.service';
import { AdminUsersService } from './services/admin-users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PaymentsService } from '../payments/payments.service';

type UploadedFileLike = { buffer: Buffer; mimetype: string; size: number };

@Injectable()
export class AdminService {
  constructor(
    private readonly statsService: AdminStatsService,
    private readonly productsCrud: AdminProductsCrudService,
    private readonly productsExport: AdminProductsExportService,
    private readonly ordersService: AdminOrdersService,
    private readonly ordersExport: AdminOrdersExportService,
    private readonly usersService: AdminUsersService,
    private readonly cloudinary: CloudinaryService,
    private readonly payments: PaymentsService,
  ) {}

  // ── Stats ─────────────────────────────────────────────────
  stats() { return this.statsService.getDashboardStats(); }

  // ── Products ──────────────────────────────────────────────
  async uploadImage(file: UploadedFileLike) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('File must be an image');
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException('Image must be under 10MB');
    const url = await this.cloudinary.uploadImage(file.buffer);
    return { url };
  }

  listProducts(p: { search?: string; page?: number; limit?: number; categoryId?: string }) { return this.productsCrud.list(p); }
  // ADMIN → published immediately; STAFF → draft (isPublished: false), awaits admin approval
  createProduct(dto: CreateProductDto, role: Role) { return this.productsCrud.create(dto, role === Role.STAFF); }
  updateProduct(id: string, dto: UpdateProductDto) { return this.productsCrud.update(id, dto); }
  approveProduct(id: string) { return this.productsCrud.approve(id); }
  deleteProduct(id: string) { return this.productsCrud.remove(id); }
  exportProductsExcel() { return this.productsExport.exportExcel(); }
  exportInventoryReport() { return this.productsExport.exportInventoryReport(); }

  // ── Orders & Users ────────────────────────────────────────
  listOrders(p: { status?: string; search?: string; page?: number; limit?: number }) { return this.ordersService.listOrders(p); }
  updateOrderStatus(orderId: string, status: string) { return this.ordersService.updateOrderStatus(orderId, status); }
  cancelOrder(orderId: string, reason: string, actorId: string) { return this.ordersService.cancelOrder(orderId, reason, actorId); }
  acceptOrder(orderId: string, actorId: string) { return this.ordersService.acceptOrder(orderId, actorId); }
  rejectOrder(orderId: string, reason: string, actorId: string) { return this.ordersService.rejectOrder(orderId, reason, actorId); }
  forcePollPayment(orderId: string) { return this.payments.forcePollPayment(orderId); }
  refundOrder(orderId: string, reason: string, actorId: string) { return this.payments.refundPayment(orderId, reason, actorId); }
  listUsers(p: { page?: number; limit?: number }) { return this.usersService.listUsers(p); }
  updateUserRole(userId: string, role: Role, requesterId: string) { return this.usersService.updateUserRole(userId, role, requesterId); }
  exportOrdersExcel() { return this.ordersExport.exportOrdersExcel(); }
}
