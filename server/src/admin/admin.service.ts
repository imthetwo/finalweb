import { Injectable } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './dto/admin-product.dto';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminProductsService } from './services/admin-products.service';
import { AdminOrdersService } from './services/admin-orders.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly statsService: AdminStatsService,
    private readonly productsService: AdminProductsService,
    private readonly ordersService: AdminOrdersService,
  ) {}

  // ── Stats ─────────────────────────────────────────────────
  stats() { return this.statsService.getDashboardStats(); }

  // ── Products ──────────────────────────────────────────────
  uploadImage(buffer: Buffer) { return this.productsService.uploadImage(buffer); }
  importProductsExcel(buffer: Buffer, asDraft = false) { return this.productsService.importExcel(buffer, asDraft); }
  exportProductTemplate() { return this.productsService.exportProductTemplate(); }
  listProducts(p: { search?: string; page?: number; limit?: number; categoryId?: string }) { return this.productsService.list(p); }
  createProduct(dto: CreateProductDto) { return this.productsService.create(dto); }
  updateProduct(id: string, dto: UpdateProductDto) { return this.productsService.update(id, dto); }
  deleteProduct(id: string) { return this.productsService.remove(id); }
  exportProductsExcel() { return this.productsService.exportExcel(); }

  // ── Orders & Users ────────────────────────────────────────
  listOrders(p: { status?: string; page?: number; limit?: number }) { return this.ordersService.listOrders(p); }
  updateOrderStatus(orderId: string, status: string) { return this.ordersService.updateOrderStatus(orderId, status); }
  listUsers(p: { page?: number; limit?: number }) { return this.ordersService.listUsers(p); }
  exportOrdersExcel() { return this.ordersService.exportOrdersExcel(); }
}
