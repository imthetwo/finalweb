import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { maxQtyFor } from '../common/quantity-caps';

// Reused Prisma include shapes — kept in one place so the cart queries below
// can't drift out of sync with each other.
const CART_WITH_ITEMS = { items: { include: { product: { include: { category: true } } } } } as const;
const CATEGORY_NAME_ONLY = { category: { select: { name: true } } } as const;

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: CART_WITH_ITEMS,
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: CART_WITH_ITEMS,
      });
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const items = cart.items.map((item) => {
      const product = this.productsService.formatProduct(item.product);
      return {
        id: item.id,
        quantity: item.quantity,
        product,
        lineTotal: product.displayPrice * item.quantity,
      };
    });
    const subTotal = items.reduce((s, i) => s + i.lineTotal, 0);
    return { id: cart.id, items, subTotal };
  }

  async addItem(userId: string, productId: string, quantity = 1) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isPublished: true },
      include: CATEGORY_NAME_ONLY,
    });
    if (!product) throw new NotFoundException('Product not found');

    const cart = await this.getOrCreateCart(userId);
    const existing = cart.items.find((i) => i.productId === productId);

    // Add-to-cart is one-shot: a product can be added only once — quantity is
    // then adjusted from the cart page (updateQuantity), never by re-adding.
    if (existing)
      throw new BadRequestException('This product is already in your cart');

    const cap = maxQtyFor(product.category?.name);
    if (quantity > cap)
      throw new BadRequestException(`Maximum ${cap} per order for ${product.category?.name ?? 'this product'}`);

    if (product.stock < quantity)
      throw new BadRequestException('Insufficient stock');

    await this.prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });

    return this.getCart(userId);
  }

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');
    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const cap = maxQtyFor(item.product.category?.name);
      if (quantity > cap)
        throw new BadRequestException(`Maximum ${cap} per order for ${item.product.category?.name ?? 'this product'}`);
      if (quantity > item.product.stock) throw new BadRequestException('Insufficient stock');
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }
    return this.getCart(userId);
  }

  // Merge a guest (localStorage) cart into the account cart on login/register.
  // Unlike addItem (one-shot: rejects a product already in the cart), a merge
  // must be lossless — if the product is already there, the quantities are
  // combined (clamped to the category cap and current stock) instead of the
  // guest's item being discarded. Products that no longer exist/are unpublished
  // are skipped and counted so the caller can inform the user.
  async mergeGuestItems(userId: string, items: { productId: string; quantity: number }[]) {
    const cart = await this.getOrCreateCart(userId);
    let merged = 0;
    let skipped = 0;

    for (const { productId, quantity } of items) {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, isPublished: true },
        include: CATEGORY_NAME_ONLY,
      });
      if (!product) { skipped++; continue; }

      const existing = cart.items.find((i) => i.productId === productId);
      const cap = Math.min(maxQtyFor(product.category?.name), product.stock);
      const finalQty = Math.min((existing?.quantity ?? 0) + quantity, cap);

      if (finalQty < 1) { skipped++; continue; } // out of stock entirely

      if (existing) {
        if (finalQty !== existing.quantity) {
          await this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: finalQty } });
        }
      } else {
        await this.prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity: finalQty } });
      }
      merged++;
    }

    const result = await this.getCart(userId);
    return { ...result, merged, skipped };
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }
}
