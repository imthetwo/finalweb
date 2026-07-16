import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';

const TTL = 60_000; // 60 seconds

@Injectable()
export class CategoriesService {
  private cache: { data: unknown; ts: number } | null = null;
  private menuCache: { data: unknown; ts: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async findAll() {
    if (this.cache && Date.now() - this.cache.ts < TTL) {
      return this.cache.data;
    }
    const counts = await this.productsService.countByCategory();
    const cats = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    const data = cats.map((c) => ({ ...c, _count: { products: counts[c.id] ?? 0 } }));
    this.cache = { data, ts: Date.now() };
    return data;
  }

  async findById(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async getMenu() {
    if (this.menuCache && Date.now() - this.menuCache.ts < TTL) {
      return this.menuCache.data;
    }
    const counts = await this.productsService.countByCategory();
    const cats = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });

    // categoryCounts keyed by category name — used by the ShopByCategory frontend
    const categoryCounts: Record<string, number> = {};
    for (const c of cats) {
      categoryCounts[c.name] = counts[c.id] ?? 0;
    }

    const sections = cats
      .filter((c) => (counts[c.id] ?? 0) > 0)
      .map((c) => ({
        key: c.name,
        href: `/components/${c.name.toLowerCase().replace(/\s+/g, '-')}`,
        categoryId: c.id,
        name: c.name,
        productCount: counts[c.id] ?? 0,
        columns: [{ title: c.name, links: [{ label: c.name, href: `/components/${c.name.toLowerCase().replace(/\s+/g, '-')}`, productCount: counts[c.id] ?? 0 }] }],
      }));
    const data = { sections, categoryCounts };
    this.menuCache = { data, ts: Date.now() };
    return data;
  }

  invalidateCache() {
    this.cache = null;
    this.menuCache = null;
  }
}
