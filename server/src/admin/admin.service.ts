import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ProductsService } from '../products/products.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  CreateProductDto,
  UpdateProductDto,
} from './dto/admin-product.dto';

const VALID_STATUSES = Object.values(OrderStatus);

const SPEC_INCLUDE = {
  cpuSpec: true,
  gpuSpec: true,
  ramSpec: true,
  motherboardSpec: true,
  psuSpec: true,
  caseSpec: true,
  coolerSpec: true,
  monitorSpec: true,
  storageSpec: true,
  laptopSpec: true,
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly products: ProductsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── Image upload ─────────────────────────────────────────
  async uploadImage(buffer: Buffer) {
    const url = await this.cloudinary.uploadImage(buffer);
    return { url };
  }

  // ── Excel import ──────────────────────────────────────────
  async importProductsExcel(buffer: Buffer) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Empty workbook');

    const header: Record<string, number> = {};
    ws.getRow(1).eachCell((cell, col) => {
      header[String(cell.value).trim().toLowerCase()] = col;
    });
    const need = ['name', 'brand', 'categoryname', 'price'];
    for (const h of need) {
      if (!header[h]) throw new BadRequestException(`Missing column: ${h}`);
    }

    const categories = await this.prisma.category.findMany({ select: { id: true, name: true } });
    const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const get = (k: string) => (header[k] ? row.getCell(header[k]).value : undefined);
      const name = get('name')?.toString().trim();
      if (!name) { result.skipped++; continue; }

      const categoryName = get('categoryname')?.toString().trim().toLowerCase();
      const categoryId = categoryName ? catByName.get(categoryName) : undefined;
      if (!categoryId) {
        result.errors.push(`Row ${r}: unknown category "${categoryName}"`);
        continue;
      }

      const price = Number(get('price')) || 0;
      if (price <= 0) { result.errors.push(`Row ${r}: invalid price`); continue; }

      const data = {
        categoryId,
        name,
        brand: get('brand')?.toString().trim() || 'Pecify',
        price,
        salePrice: get('saleprice') ? Number(get('saleprice')) : null,
        stock: get('stock') ? Number(get('stock')) : 10,
        isPublished: true,
      };

      try {
        const existing = await this.prisma.product.findFirst({ where: { name, categoryId } });
        if (existing) {
          await this.prisma.product.update({ where: { id: existing.id }, data });
          result.updated++;
        } else {
          await this.prisma.product.create({ data });
          result.created++;
        }
      } catch (e) {
        result.errors.push(`Row ${r}: ${(e as Error).message}`);
      }
    }
    return result;
  }

  // ── Dashboard ─────────────────────────────────────────────
  async stats() {
    const [revenueAgg, orderCount, userCount, productCount, recentOrders, lowStock] =
      await Promise.all([
        this.prisma.order.aggregate({ where: { isPaid: true }, _sum: { totalAmount: true } }),
        this.prisma.order.count(),
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: { user: { select: { fullName: true, email: true } } },
        }),
        this.prisma.product.count({ where: { stock: { lte: 5 }, isPublished: true } }),
      ]);

    return {
      totalRevenue: revenueAgg._sum.totalAmount ?? 0,
      orderCount,
      userCount,
      productCount,
      lowStockCount: lowStock,
      recentOrders,
    };
  }

  // ── Products CRUD ──────────────────────────────────────────
  async listProducts(params: {
    search?: string;
    page?: number;
    limit?: number;
    categoryId?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const where: Prisma.ProductWhereInput = {};
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { brand: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { id: true, name: true } }, ...SPEC_INCLUDE },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((p) => this.products.formatProduct(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createProduct(dto: CreateProductDto) {
    const { cpuSpec, gpuSpec, ramSpec, motherboardSpec, psuSpec, caseSpec, coolerSpec, monitorSpec, storageSpec, laptopSpec, ...base } = dto;
    return this.prisma.product.create({
      data: {
        ...base,
        ...(cpuSpec ? { cpuSpec: { create: cpuSpec } } : {}),
        ...(gpuSpec ? { gpuSpec: { create: gpuSpec } } : {}),
        ...(ramSpec ? { ramSpec: { create: ramSpec } } : {}),
        ...(motherboardSpec ? { motherboardSpec: { create: motherboardSpec } } : {}),
        ...(psuSpec ? { psuSpec: { create: psuSpec } } : {}),
        ...(caseSpec ? { caseSpec: { create: caseSpec } } : {}),
        ...(coolerSpec ? { coolerSpec: { create: coolerSpec } } : {}),
        ...(monitorSpec ? { monitorSpec: { create: monitorSpec } } : {}),
        ...(storageSpec ? { storageSpec: { create: storageSpec } } : {}),
        ...(laptopSpec ? { laptopSpec: { create: laptopSpec } } : {}),
      },
      include: { category: { select: { id: true, name: true } }, ...SPEC_INCLUDE },
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.assertProduct(id);
    const { cpuSpec, gpuSpec, ramSpec, motherboardSpec, psuSpec, caseSpec, coolerSpec, monitorSpec, storageSpec, laptopSpec, ...base } = dto;

    const data: Prisma.ProductUncheckedUpdateInput = { ...base };

    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(cpuSpec ? { cpuSpec: { upsert: { create: cpuSpec, update: cpuSpec } } } : {}),
        ...(gpuSpec ? { gpuSpec: { upsert: { create: gpuSpec, update: gpuSpec } } } : {}),
        ...(ramSpec ? { ramSpec: { upsert: { create: ramSpec, update: ramSpec } } } : {}),
        ...(motherboardSpec ? { motherboardSpec: { upsert: { create: motherboardSpec, update: motherboardSpec } } } : {}),
        ...(psuSpec ? { psuSpec: { upsert: { create: psuSpec, update: psuSpec } } } : {}),
        ...(caseSpec ? { caseSpec: { upsert: { create: caseSpec, update: caseSpec } } } : {}),
        ...(coolerSpec ? { coolerSpec: { upsert: { create: coolerSpec, update: coolerSpec } } } : {}),
        ...(monitorSpec ? { monitorSpec: { upsert: { create: monitorSpec, update: monitorSpec } } } : {}),
        ...(storageSpec ? { storageSpec: { upsert: { create: storageSpec, update: storageSpec } } } : {}),
        ...(laptopSpec ? { laptopSpec: { upsert: { create: laptopSpec, update: laptopSpec } } } : {}),
      },
      include: { category: { select: { id: true, name: true } }, ...SPEC_INCLUDE },
    });
  }

  async deleteProduct(id: string) {
    await this.assertProduct(id);
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  private async assertProduct(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Product not found');
  }

  // ── Orders ────────────────────────────────────────────────
  async listOrders(params: { status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const where: Prisma.OrderWhereInput =
      params.status && VALID_STATUSES.includes(params.status as OrderStatus)
        ? { status: params.status as OrderStatus }
        : {};

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { fullName: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateOrderStatus(orderId: string, status: string) {
    if (!VALID_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException('Invalid status');
    }
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });

    if (order.user?.email) {
      this.email.sendOrderStatusUpdate(order.user.email, orderId, status).catch(() => {});
    }
    return updated;
  }

  // ── Users ─────────────────────────────────────────────────
  listUsers(params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 50, 200);
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
  }

  // ── Excel export (orders) ─────────────────────────────────
  async exportOrdersExcel(): Promise<ExcelJS.Buffer> {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } } },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Orders');
    ws.columns = [
      { header: 'Order ID', key: 'id', width: 16 },
      { header: 'Customer', key: 'customer', width: 24 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Total (VND)', key: 'total', width: 18 },
      { header: 'Payment', key: 'paymentMethod', width: 14 },
      { header: 'Paid', key: 'isPaid', width: 10 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Created at', key: 'createdAt', width: 22 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const o of orders) {
      ws.addRow({
        id: o.id.slice(0, 8).toUpperCase(),
        customer: o.user?.fullName ?? '—',
        email: o.user?.email ?? '—',
        total: o.totalAmount,
        paymentMethod: o.paymentMethod,
        isPaid: o.isPaid ? 'Yes' : 'No',
        status: o.status,
        createdAt: o.createdAt.toLocaleString('en-GB'),
      });
    }

    return wb.xlsx.writeBuffer();
  }

  // ── Excel export (products — mỗi loại 1 sheet) ───────────
  async exportProductsExcel(): Promise<ExcelJS.Buffer> {
    const all = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: { category: { select: { name: true } }, ...SPEC_INCLUDE },
    });

    const wb = new ExcelJS.Workbook();

    const base = (p: (typeof all)[0]) => ({
      name: p.name,
      brand: p.brand,
      category: p.category?.name ?? '',
      price: p.price,
      salePrice: p.salePrice ?? '',
      stock: p.stock,
      published: p.isPublished ? 'Yes' : 'No',
    });

    const addSheet = (name: string, cols: ExcelJS.Column[], rows: Record<string, unknown>[]) => {
      const ws = wb.addWorksheet(name);
      ws.columns = cols;
      ws.getRow(1).font = { bold: true };
      rows.forEach((r) => ws.addRow(r));
    };

    addSheet('CPU', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'Socket', key: 'socket', width: 12 }, { header: 'Cores', key: 'cores', width: 8 },
      { header: 'Threads', key: 'threads', width: 8 }, { header: 'Base GHz', key: 'baseClockGhz', width: 10 },
      { header: 'Boost GHz', key: 'boostClockGhz', width: 10 }, { header: 'TDP (W)', key: 'tdp', width: 8 },
      { header: 'L3 Cache', key: 'cacheL3', width: 10 }, { header: 'Generation', key: 'generation', width: 20 },
    ] as ExcelJS.Column[], all.filter((p) => p.cpuSpec).map((p) => ({ ...base(p), ...p.cpuSpec! })));

    addSheet('GPU', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'VRAM (GB)', key: 'vramGb', width: 10 }, { header: 'TDP (W)', key: 'tdp', width: 8 },
      { header: 'Length (mm)', key: 'lengthMm', width: 12 }, { header: 'PCIe Gen', key: 'pcieGen', width: 10 },
      { header: 'Boost MHz', key: 'boostClockMhz', width: 12 }, { header: 'Mem Type', key: 'memType', width: 12 },
    ] as ExcelJS.Column[], all.filter((p) => p.gpuSpec).map((p) => ({ ...base(p), ...p.gpuSpec! })));

    addSheet('RAM', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'Capacity (GB)', key: 'capacityGb', width: 14 }, { header: 'Speed (MHz)', key: 'speedMhz', width: 12 },
      { header: 'Generation', key: 'generation', width: 10 }, { header: 'Latency', key: 'latency', width: 10 },
      { header: 'Kit', key: 'kit', width: 10 },
    ] as ExcelJS.Column[], all.filter((p) => p.ramSpec).map((p) => ({ ...base(p), ...p.ramSpec! })));

    addSheet('Motherboard', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'Socket', key: 'socket', width: 12 }, { header: 'Chipset', key: 'chipset', width: 12 },
      { header: 'Form Factor', key: 'formFactor', width: 12 }, { header: 'RAM Gen', key: 'ramGen', width: 10 },
      { header: 'RAM Slots', key: 'ramSlots', width: 10 }, { header: 'Max RAM (GB)', key: 'maxRamGb', width: 12 },
    ] as ExcelJS.Column[], all.filter((p) => p.motherboardSpec).map((p) => ({ ...base(p), ...p.motherboardSpec! })));

    addSheet('PSU', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'Wattage', key: 'wattage', width: 12 }, { header: 'Efficiency', key: 'efficiency', width: 16 },
      { header: 'Modular', key: 'modular', width: 12 },
    ] as ExcelJS.Column[], all.filter((p) => p.psuSpec).map((p) => ({ ...base(p), ...p.psuSpec! })));

    addSheet('Case', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'Form Factor', key: 'formFactor', width: 12 }, { header: 'Max GPU (mm)', key: 'maxGpuLengthMm', width: 14 },
      { header: 'Radiator', key: 'radiatorSupport', width: 14 }, { header: 'Drive Bays', key: 'driveBays', width: 10 },
    ] as ExcelJS.Column[], all.filter((p) => p.caseSpec).map((p) => ({ ...base(p), ...p.caseSpec! })));

    addSheet('Cooler', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'Type', key: 'coolerType', width: 10 }, { header: 'TDP Rating (W)', key: 'tdpRating', width: 14 },
      { header: 'Radiator (mm)', key: 'radiatorSizeMm', width: 14 }, { header: 'Sockets', key: 'socketSupport', width: 24 },
    ] as ExcelJS.Column[], all.filter((p) => p.coolerSpec).map((p) => ({ ...base(p), ...p.coolerSpec! })));

    addSheet('Monitor', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'Size (in)', key: 'sizeIn', width: 10 }, { header: 'Resolution', key: 'resolution', width: 14 },
      { header: 'Refresh Hz', key: 'refreshRateHz', width: 12 }, { header: 'Panel', key: 'panelType', width: 10 },
      { header: 'Response (ms)', key: 'responseMs', width: 14 }, { header: 'HDR', key: 'hdr', width: 8 },
    ] as ExcelJS.Column[], all.filter((p) => p.monitorSpec).map((p) => ({ ...base(p), ...p.monitorSpec! })));

    addSheet('Storage', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'Capacity (GB)', key: 'capacityGb', width: 14 }, { header: 'Type', key: 'storageType', width: 10 },
      { header: 'Interface', key: 'interfaceType', width: 14 }, { header: 'Read MB/s', key: 'readMbps', width: 12 },
      { header: 'Write MB/s', key: 'writeMbps', width: 12 },
    ] as ExcelJS.Column[], all.filter((p) => p.storageSpec).map((p) => ({ ...base(p), ...p.storageSpec! })));

    addSheet('Laptop', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
      { header: 'CPU', key: 'cpu', width: 28 }, { header: 'GPU', key: 'gpu', width: 20 },
      { header: 'RAM (GB)', key: 'ramGb', width: 10 }, { header: 'Storage (GB)', key: 'storageGb', width: 12 },
      { header: 'Display (in)', key: 'displaySizeIn', width: 12 }, { header: 'Resolution', key: 'displayResolution', width: 14 },
      { header: 'OS', key: 'os', width: 14 },
    ] as ExcelJS.Column[], all.filter((p) => p.laptopSpec).map((p) => ({ ...base(p), ...p.laptopSpec! })));

    addSheet('Other', [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 }, { header: 'Price', key: 'price', width: 14 },
      { header: 'Sale', key: 'salePrice', width: 14 }, { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 },
    ] as ExcelJS.Column[], all.filter((p) =>
      !p.cpuSpec && !p.gpuSpec && !p.ramSpec && !p.motherboardSpec && !p.psuSpec &&
      !p.caseSpec && !p.coolerSpec && !p.monitorSpec && !p.storageSpec && !p.laptopSpec
    ).map((p) => base(p)));

    return wb.xlsx.writeBuffer();
  }

}
