import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../../products/products.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CreateProductDto, UpdateProductDto } from '../dto/admin-product.dto';

const SPEC_INCLUDE = {
  cpuSpec: true, gpuSpec: true, ramSpec: true, motherboardSpec: true,
  psuSpec: true, caseSpec: true, coolerSpec: true, monitorSpec: true,
  storageSpec: true, laptopSpec: true,
} as const;

@Injectable()
export class AdminProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── Image ─────────────────────────────────────────────────
  async uploadImage(buffer: Buffer) {
    const url = await this.cloudinary.uploadImage(buffer);
    return { url };
  }

  // ── Excel import ──────────────────────────────────────────
  async importExcel(buffer: Buffer) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Empty workbook');

    const header: Record<string, number> = {};
    ws.getRow(1).eachCell((cell, col) => { header[String(cell.value).trim().toLowerCase()] = col; });
    for (const h of ['name', 'brand', 'categoryname', 'price']) {
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

      const categoryId = catByName.get(get('categoryname')?.toString().trim().toLowerCase() ?? '');
      if (!categoryId) { result.errors.push(`Row ${r}: unknown category`); continue; }

      const price = Number(get('price')) || 0;
      if (price <= 0) { result.errors.push(`Row ${r}: invalid price`); continue; }

      const data = {
        categoryId, name,
        brand: get('brand')?.toString().trim() || 'Pecify',
        price,
        salePrice: get('saleprice') ? Number(get('saleprice')) : null,
        stock: get('stock') ? Number(get('stock')) : 10,
        isPublished: true,
      };

      try {
        const existing = await this.prisma.product.findFirst({ where: { name, categoryId } });
        if (existing) { await this.prisma.product.update({ where: { id: existing.id }, data }); result.updated++; }
        else { await this.prisma.product.create({ data }); result.created++; }
      } catch (e) { result.errors.push(`Row ${r}: ${(e as Error).message}`); }
    }
    return result;
  }

  // ── CRUD ──────────────────────────────────────────────────
  async list(params: { search?: string; page?: number; limit?: number; categoryId?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const where: Prisma.ProductWhereInput = {};
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.search) where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { brand: { contains: params.search, mode: 'insensitive' } },
    ];

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: { category: { select: { id: true, name: true } }, ...SPEC_INCLUDE },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map((p) => this.products.formatProduct(p)), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateProductDto) {
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

  async update(id: string, dto: UpdateProductDto) {
    await this.assertExists(id);
    const { cpuSpec, gpuSpec, ramSpec, motherboardSpec, psuSpec, caseSpec, coolerSpec, monitorSpec, storageSpec, laptopSpec, ...base } = dto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(base as Prisma.ProductUncheckedUpdateInput),
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

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  private async assertExists(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Product not found');
  }

  // ── Excel export ──────────────────────────────────────────
  async exportExcel(): Promise<ExcelJS.Buffer> {
    const all = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: { category: { select: { name: true } }, ...SPEC_INCLUDE },
    });
    const wb = new ExcelJS.Workbook();

    const base = (p: (typeof all)[0]) => ({
      name: p.name, brand: p.brand, category: p.category?.name ?? '',
      costPrice: p.costPrice ?? '', price: p.price, salePrice: p.salePrice ?? '',
      margin: p.costPrice ? `${Math.round((1 - p.costPrice / p.price) * 100)}%` : '',
      stock: p.stock, published: p.isPublished ? 'Yes' : 'No',
    });

    const sheet = (name: string, cols: Partial<ExcelJS.Column>[], rows: Record<string, unknown>[]) => {
      const ws = wb.addWorksheet(name);
      ws.columns = cols;
      ws.getRow(1).font = { bold: true };
      rows.forEach((r) => ws.addRow(r));
    };

    const baseCols = (extra: Partial<ExcelJS.Column>[]) => [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Cost Price', key: 'costPrice', width: 14 },
      { header: 'Price', key: 'price', width: 14 }, { header: 'Sale', key: 'salePrice', width: 14 },
      { header: 'Margin', key: 'margin', width: 10 },
      { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Published', key: 'published', width: 10 }, ...extra,
    ] as ExcelJS.Column[];

    sheet('CPU', baseCols([
      { header: 'Socket', key: 'socket', width: 12 }, { header: 'Cores', key: 'cores', width: 8 },
      { header: 'Threads', key: 'threads', width: 8 }, { header: 'Base GHz', key: 'baseClockGhz', width: 10 },
      { header: 'Boost GHz', key: 'boostClockGhz', width: 10 }, { header: 'TDP (W)', key: 'tdp', width: 8 },
    ]), all.filter((p) => p.cpuSpec).map((p) => ({ ...base(p), ...p.cpuSpec! })));

    sheet('GPU', baseCols([
      { header: 'VRAM (GB)', key: 'vramGb', width: 10 }, { header: 'TDP (W)', key: 'tdp', width: 8 },
      { header: 'Mem Type', key: 'memType', width: 12 }, { header: 'PCIe Gen', key: 'pcieGen', width: 10 },
    ]), all.filter((p) => p.gpuSpec).map((p) => ({ ...base(p), ...p.gpuSpec! })));

    sheet('RAM', baseCols([
      { header: 'Capacity (GB)', key: 'capacityGb', width: 14 }, { header: 'Speed (MHz)', key: 'speedMhz', width: 12 },
      { header: 'Generation', key: 'generation', width: 10 }, { header: 'Latency', key: 'latency', width: 10 },
    ]), all.filter((p) => p.ramSpec).map((p) => ({ ...base(p), ...p.ramSpec! })));

    sheet('Motherboard', baseCols([
      { header: 'Socket', key: 'socket', width: 12 }, { header: 'Chipset', key: 'chipset', width: 12 },
      { header: 'Form Factor', key: 'formFactor', width: 12 }, { header: 'RAM Gen', key: 'ramGen', width: 10 },
    ]), all.filter((p) => p.motherboardSpec).map((p) => ({ ...base(p), ...p.motherboardSpec! })));

    sheet('PSU', baseCols([
      { header: 'Wattage', key: 'wattage', width: 12 }, { header: 'Efficiency', key: 'efficiency', width: 16 },
      { header: 'Modular', key: 'modular', width: 12 },
    ]), all.filter((p) => p.psuSpec).map((p) => ({ ...base(p), ...p.psuSpec! })));

    sheet('Case', baseCols([
      { header: 'Form Factor', key: 'formFactor', width: 12 }, { header: 'Max GPU (mm)', key: 'maxGpuLengthMm', width: 14 },
    ]), all.filter((p) => p.caseSpec).map((p) => ({ ...base(p), ...p.caseSpec! })));

    sheet('Cooler', baseCols([
      { header: 'Type', key: 'coolerType', width: 10 }, { header: 'TDP Rating (W)', key: 'tdpRating', width: 14 },
      { header: 'Radiator (mm)', key: 'radiatorSizeMm', width: 14 },
    ]), all.filter((p) => p.coolerSpec).map((p) => ({ ...base(p), ...p.coolerSpec! })));

    sheet('Monitor', baseCols([
      { header: 'Size (in)', key: 'sizeIn', width: 10 }, { header: 'Resolution', key: 'resolution', width: 14 },
      { header: 'Refresh Hz', key: 'refreshRateHz', width: 12 }, { header: 'Panel', key: 'panelType', width: 10 },
    ]), all.filter((p) => p.monitorSpec).map((p) => ({ ...base(p), ...p.monitorSpec! })));

    sheet('Storage', baseCols([
      { header: 'Capacity (GB)', key: 'capacityGb', width: 14 }, { header: 'Type', key: 'storageType', width: 10 },
      { header: 'Interface', key: 'interfaceType', width: 14 }, { header: 'Read MB/s', key: 'readMbps', width: 12 },
    ]), all.filter((p) => p.storageSpec).map((p) => ({ ...base(p), ...p.storageSpec! })));

    sheet('Laptop', baseCols([
      { header: 'CPU', key: 'cpu', width: 28 }, { header: 'GPU', key: 'gpu', width: 20 },
      { header: 'RAM (GB)', key: 'ramGb', width: 10 }, { header: 'Storage (GB)', key: 'storageGb', width: 12 },
    ]), all.filter((p) => p.laptopSpec).map((p) => ({ ...base(p), ...p.laptopSpec! })));

    sheet('Other', baseCols([]),
      all.filter((p) => !p.cpuSpec && !p.gpuSpec && !p.ramSpec && !p.motherboardSpec && !p.psuSpec &&
        !p.caseSpec && !p.coolerSpec && !p.monitorSpec && !p.storageSpec && !p.laptopSpec).map(base));

    return wb.xlsx.writeBuffer();
  }
}
