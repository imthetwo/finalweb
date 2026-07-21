import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async list(userId: string) {
    const entries = await this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true, name: true, brand: true, price: true,
            salePrice: true, stock: true, isPublished: true,
            imageUrl: true, category: { select: { id: true, name: true } },
          },
        },
      },
    });
    return entries.map((e) => ({
      id: e.id,
      addedAt: e.createdAt,
      product: this.productsService.formatProduct(e.product),
    }));
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isPublished: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) throw new ConflictException('Already in wishlist');

    try {
      await this.prisma.wishlist.create({ data: { userId, productId } });
    } catch (e) {
      // A concurrent duplicate add (rapid double-click) can slip past the
      // check above and hit the unique constraint instead — report it the
      // same friendly way rather than letting it surface as a raw 500.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Already in wishlist');
      }
      throw e;
    }
    return { ok: true };
  }

  async remove(userId: string, productId: string) {
    const entry = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!entry) throw new NotFoundException('Wishlist entry not found');
    await this.prisma.wishlist.delete({ where: { id: entry.id } });
    return { ok: true };
  }
}
