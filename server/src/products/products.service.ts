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
    if (params.search) {
      where.OR = [
        { name:  { contains: params.search, mode: 'insensitive' } },
        { brand: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true, name: true, brand: true, price: true, salePrice: true,
          stock: true, isPublished: true, imageUrl: true,
          category: { select: { id: true, name: true } },
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
