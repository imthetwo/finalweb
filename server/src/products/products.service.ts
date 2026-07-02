import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  formatProduct<T extends { imageUrl: string | null; salePrice: number | null; price: number }>(p: T) {
    const base = process.env.API_PUBLIC_URL || 'http://localhost:3001';
    const raw = p.imageUrl;
    const thumbnailUrl = raw
      ? raw.startsWith('http') ? raw : `${base}${raw}`
      : null;
    return {
      ...p,
      thumbnailUrl,
      displayPrice: p.salePrice ?? p.price,
    };
  }

  async findAll(params: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page  = params.page ?? 1;
    const limit = Math.min(params.limit ?? 24, 100);
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = { isPublished: true };
    if (params.categoryId) where.categoryId = params.categoryId;
    const search = params.search?.slice(0, 100); // prevent ReDoS via overly long input
    if (search) { params.search = search; }
    if (params.search) {
      const q = params.search;
      where.OR = [
        // Tên sản phẩm bắt đầu bằng từ khóa
        { name:  { startsWith: q, mode: 'insensitive' } },
        // Từ trong tên bắt đầu bằng từ khóa (có khoảng trắng trước)
        { name:  { contains: ` ${q}`, mode: 'insensitive' } },
        // Thương hiệu khớp: "intel", "amd", "corsair"
        { brand: { startsWith: q, mode: 'insensitive' } },
        // Category bắt đầu bằng từ khóa: "ca" → "Case Fans" ✅, "pc" → "PC Cases" ✅
        { category: { name: { startsWith: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true, name: true, brand: true, price: true, salePrice: true,
          stock: true, isPublished: true, imageUrl: true,
          category: { select: { id: true, name: true } },
          cpuSpec:         { select: { socket: true, tdp: true } },
          gpuSpec:         { select: { tdp: true, lengthMm: true } },
          ramSpec:         { select: { generation: true, speedMhz: true } },
          motherboardSpec: { select: { socket: true, ramGen: true, formFactor: true, ramSlots: true, maxRamGb: true } },
          psuSpec:         { select: { wattage: true } },
          caseSpec:        { select: { formFactor: true, maxGpuLengthMm: true } },
          coolerSpec:      { select: { socketSupport: true, tdpRating: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((p) => this.formatProduct(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isPublished: true },
      include: {
        category: { select: { id: true, name: true } },
        // Only load specs that exist (Prisma skips nulls automatically)
        cpuSpec: true, gpuSpec: true, ramSpec: true, motherboardSpec: true,
        psuSpec: true, caseSpec: true, coolerSpec: true, monitorSpec: true,
        storageSpec: true, laptopSpec: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.formatProduct(product);
  }

  async countByCategory(): Promise<Record<string, number>> {
    const rows = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: { isPublished: true },
      _count: { id: true },
    });
    const out: Record<string, number> = {};
    for (const row of rows) {
      out[row.categoryId] = (out[row.categoryId] ?? 0) + row._count.id;
    }
    return out;
  }
}
