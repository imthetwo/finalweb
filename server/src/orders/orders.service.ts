import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';

const SHIPPING_FEE = 30000;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly coupons: CouponsService,
  ) {}

  async createFromCart(
    userId: string,
    body: { shippingInfo: Record<string, string>; paymentMethod: string; couponCode?: string },
  ) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    const subTotal = cart.subTotal;

    // Validate coupon nếu có
    let discount = 0;
    let appliedCoupon: string | null = null;
    if (body.couponCode) {
      const result = await this.coupons.validate(body.couponCode, subTotal);
      if (result.valid) {
        discount = result.discount;
        appliedCoupon = result.code ?? body.couponCode;
      }
    }

    const totalAmount = subTotal - discount + SHIPPING_FEE;

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0)
          throw new BadRequestException(`Out of stock: ${item.product.name}`);
      }

      const created = await tx.order.create({
        data: {
          userId,
          subTotal,
          discount,
          shippingFee: SHIPPING_FEE,
          totalAmount,
          couponCode: appliedCoupon,
          paymentMethod: body.paymentMethod,
          shippingInfo: body.shippingInfo,
          status: body.paymentMethod === 'COD' ? OrderStatus.PROCESSING : OrderStatus.PENDING,
          isPaid: body.paymentMethod === 'COD',
          items: {
            create: cart.items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              priceAtBuy: item.product.displayPrice,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });

      // Mark coupon used inside transaction so it rolls back if order creation fails
      if (appliedCoupon) {
        await tx.coupon.updateMany({
          where: { code: appliedCoupon.trim().toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });

    this.logger.log(`Order ${order.id} created for user ${userId} — total ${order.totalAmount} — method ${body.paymentMethod}`);
    return order;
  }

  // ── Guest checkout (cart lives in localStorage, sent in body) ────────────────
  async createFromGuestItems(body: GuestCheckoutDto) {
    if (!body.items.length) throw new BadRequestException('Cart is empty');

    const products = await this.prisma.product.findMany({
      where: { id: { in: body.items.map((i) => i.productId) }, isPublished: true },
    });

    const cartItems = body.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Product not found: ${item.productId}`);
      return { product, quantity: item.quantity, price: product.salePrice ?? product.price };
    });

    const subTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

    let discount = 0;
    let appliedCoupon: string | null = null;
    if (body.couponCode) {
      const result = await this.coupons.validate(body.couponCode, subTotal);
      if (result.valid) {
        discount = result.discount;
        appliedCoupon = result.code ?? body.couponCode;
      }
    }

    const totalAmount = subTotal - discount + SHIPPING_FEE;

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0)
          throw new BadRequestException(`Out of stock: ${item.product.name}`);
      }

      const created = await tx.order.create({
        data: {
          guestEmail: body.guestEmail ?? undefined,
          subTotal,
          discount,
          shippingFee: SHIPPING_FEE,
          totalAmount,
          couponCode: appliedCoupon,
          paymentMethod: body.paymentMethod,
          shippingInfo: body.shippingInfo,
          status: body.paymentMethod === 'COD' ? OrderStatus.PROCESSING : OrderStatus.PENDING,
          isPaid: body.paymentMethod === 'COD',
          items: {
            create: cartItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              priceAtBuy: item.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      if (appliedCoupon) {
        await tx.coupon.updateMany({
          where: { code: appliedCoupon.trim().toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });

    this.logger.log(`Guest order ${order.id} — total ${order.totalAmount} — method ${body.paymentMethod}`);
    return order;
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
      },
    });
  }

  async getOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.isPaid) throw new BadRequestException('Cannot cancel a paid order');
    if (!['PENDING', 'PROCESSING'].includes(order.status))
      throw new BadRequestException('Cannot cancel this order');

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      this.logger.log(`Order ${orderId} cancelled by user ${userId}`);
      return cancelled;
    });
  }
}
