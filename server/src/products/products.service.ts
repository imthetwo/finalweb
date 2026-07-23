import { Injectable, NotFoundException } from '@nestjs/common';
import { FurnitureType, PcBuildType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { effectivePrice } from '../common/pricing';

// Search terms that don't literally appear anywhere in their matching
// category's name — switching category matching to `contains` (see
// findAll() below) already covers most abbreviations, since e.g. "Graphics
// Cards (GPU)"/"Processors (CPU)"/"Storage (SSD/HDD)" all spell the
// abbreviation out in parentheses. These are the genuine leftover gaps: an
// irregular plural and abbreviations with no literal spelling in the name.
const CATEGORY_SEARCH_SYNONYMS: Record<string, string> = {
  mouse: 'mice',
  psu: 'power',
  memory: 'ram',
};

// Exported so the admin products services (which need the same shape for
// their own list/create/update/export queries) don't redeclare it.
export const SPEC_INCLUDE = {
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
  pcBuildSpec: true,
  furnitureSpec: true,
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
      displayPrice: effectivePrice(p),
    };
  }

  async findAll(params: {
    categoryId?: string;
    search?: string;
    buildType?: string;
    storageType?: string;
    coolerType?: string;
    furnitureType?: string;
    sortBy?: string;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const page  = params.page ?? 1;
    const limit = Math.min(params.limit ?? 24, 100);
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = { isPublished: true };
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.buildType && (Object.values(PcBuildType) as string[]).includes(params.buildType)) {
      where.pcBuildSpec = { buildType: params.buildType as PcBuildType };
    }
    if (params.storageType) {
      const types = params.storageType.split(',').map((t) => t.trim()).filter(Boolean);
      where.storageSpec = types.length > 1
        ? { storageType: { in: types } }
        : { storageType: { equals: types[0], mode: 'insensitive' } };
    }
    if (params.coolerType) where.coolerSpec = { coolerType: { equals: params.coolerType, mode: 'insensitive' } };
    if (params.furnitureType && (Object.values(FurnitureType) as string[]).includes(params.furnitureType)) {
      where.furnitureSpec = { furnitureType: params.furnitureType as FurnitureType };
    }
    const search = params.search?.slice(0, 100); // prevent ReDoS via overly long input
    if (search) { params.search = search; }
    if (params.search) {
      const q = params.search;
      const orConditions: Record<string, unknown>[] = [
        // Product name starts with the keyword
        { name:  { startsWith: q, mode: 'insensitive' } },
        // A word within the name starts with the keyword (preceded by a space)
        { name:  { contains: ` ${q}`, mode: 'insensitive' } },
        // Brand matches: "intel", "amd", "corsair"
        { brand: { startsWith: q, mode: 'insensitive' } },
        // Category name contains the keyword anywhere, not just as a prefix —
        // most category names are "<Adjective> <Thing>" ("Gaming Mice",
        // "Mechanical Keyboards", "CPU Coolers"), so the word a shopper
        // actually searches for ("mice", "keyboard", "cooler") is usually in
        // the middle/end, not the start.
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ];
      // A few PC-part search terms don't literally appear in their category
      // name at all — an irregular plural ("mouse" -> "Mice") or a common
      // abbreviation ("gpu" -> "Graphics Cards"). Expand the query to also
      // try each one's real category wording.
      const synonym = CATEGORY_SEARCH_SYNONYMS[q.toLowerCase()];
      if (synonym) {
        orConditions.push({ category: { name: { contains: synonym, mode: 'insensitive' } } });
      }
      where.OR = orConditions;
    }

    // effectivePrice (salePrice when it's a real discount, else price) is a
    // computed value, not a bare column — Prisma's `orderBy` can't express
    // "ORDER BY LEAST(sale, price) unless sale >= price" directly. So: fetch
    // every matching row's id + the two raw price columns (cheap — no specs,
    // no images), sort/paginate THAT in JS using the same effectivePrice()
    // used everywhere else, then do a normal Prisma findMany for just the
    // resulting page's ids to get the full shape. Keeps a single source of
    // truth for "what does this product cost" instead of re-deriving a SQL
    // equivalent that could drift from it.
    const maxPrice = params.maxPrice;
    const candidates = await this.prisma.product.findMany({
      where,
      select: { id: true, name: true, price: true, salePrice: true },
    });

    let ranked = candidates.map((p) => ({ ...p, displayPrice: effectivePrice(p) }));
    if (maxPrice != null) ranked = ranked.filter((p) => p.displayPrice <= maxPrice);

    if (params.sortBy === 'price-asc')       ranked.sort((a, b) => a.displayPrice - b.displayPrice);
    else if (params.sortBy === 'price-desc') ranked.sort((a, b) => b.displayPrice - a.displayPrice);
    else if (params.sortBy === 'name')       ranked.sort((a, b) => a.name.localeCompare(b.name));
    else                                     ranked.sort((a, b) => a.name.localeCompare(b.name));

    const total = ranked.length;
    const pageIds = ranked.slice(skip, skip + limit).map((p) => p.id);

    const rows = pageIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: pageIds } },
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
            storageSpec:     { select: { capacityGb: true, interfaceType: true } },
            pcBuildSpec:     { select: { buildType: true } },
            furnitureSpec:   { select: { furnitureType: true } },
          },
        })
      : [];

    // findMany({ id: { in } }) doesn't preserve input order — reassert the
    // already-decided rank/page order from `ranked` above.
    const byId = new Map(rows.map((r) => [r.id, r]));
    const items = pageIds.map((id) => byId.get(id)!).filter(Boolean);

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
        ...SPEC_INCLUDE,
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
