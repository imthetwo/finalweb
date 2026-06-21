import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async createFromCart(
    userId: string,
    body: {
      shippingInfo: Record<string, string>;
      paymentMethod: string;
    },
  ) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const totalAmount = cart.subTotal + 30000; // 30k shipping fee

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException(`Out of stock: ${item.product.name}`);
        }
      }

      const created = await tx.order.create({
        data: {
          userId,
          totalAmount,
          paymentMethod: body.paymentMethod,
          shippingInfo: body.shippingInfo,
          status: body.paymentMethod === 'COD' ? OrderStatus.PROCESSING : OrderStatus.PENDING,
          isPaid: body.paymentMethod === 'COD',
          items: {
            create: cart.items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              priceAtBuy: item.product.salePrice ?? item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return created;
    });

    return order;
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
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
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      throw new BadRequestException('Cannot cancel this order');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
    });
  }
}
