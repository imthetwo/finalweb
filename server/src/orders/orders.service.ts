import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { EmailService } from '../email/email.service';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';
import { ShippingInfoDto } from './dto/shipping-info.dto';
import { maxQtyFor } from '../common/quantity-caps';
import { AddressesService } from '../addresses/addresses.service';

const SHIPPING_FEE = 30000;          // flat shipping rate (VND)
const FREE_SHIPPING_OVER = 2000000;  // free shipping threshold (VND) — matches the PromoBar promise
const shippingFor = (subTotal: number) => (subTotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE);

// Accepted payment methods — COD is paid on delivery, MOMO through the gateway.
const ALLOWED_METHODS = ['COD', 'MOMO'];
const assertMethod = (m: string) => {
  if (!ALLOWED_METHODS.includes(m)) throw new BadRequestException('Unsupported payment method');
};

// Reused Prisma `items` shapes — kept in one place so the various order
// queries below can't drift out of sync with each other.
const ORDER_ITEMS_WITH_PRODUCT = { include: { product: true } } as const;
const ORDER_ITEMS_WITH_PRODUCT_SUMMARY = {
  include: { product: { select: { id: true, name: true, imageUrl: true } } },
} as const;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly email: EmailService,
    private readonly addresses: AddressesService,
  ) {}

  async createFromCart(
    userId: string,
    body: { shippingInfo: ShippingInfoDto; paymentMethod: string; saveAddress?: boolean },
  ) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');
    assertMethod(body.paymentMethod);

    const subTotal = cart.subTotal;
    const shippingFee = shippingFor(subTotal);
    const totalAmount = subTotal + shippingFee;

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
          shippingFee,
          totalAmount,
          paymentMethod: body.paymentMethod,
          shippingInfo: body.shippingInfo as unknown as Prisma.InputJsonObject,
          // COD needs no payment gate, but still needs a staff Accept/Reject
          // before fulfillment (e.g. inventory turns out unavailable) — MoMo
          // only reaches AWAITING_CONFIRMATION once payment actually clears
          // (see PaymentsService.markOrderPaid).
          status: body.paymentMethod === 'COD' ? OrderStatus.AWAITING_CONFIRMATION : OrderStatus.PENDING,
          isPaid: body.paymentMethod === 'COD',
          items: {
            create: cart.items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              priceAtBuy: item.product.displayPrice,
            })),
          },
        },
        include: { items: ORDER_ITEMS_WITH_PRODUCT, user: { select: { email: true } } },
      });

      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });

      return created;
    });

    this.logger.log(`Order ${order.id} created for user ${userId} — total ${order.totalAmount} — method ${body.paymentMethod}`);

    // Opt-in from the checkout "Save this address" checkbox. Best-effort: a
    // failure here must never roll back or fail an otherwise-successful order.
    if (body.saveAddress) {
      this.addresses
        .saveFromCheckout(userId, body.shippingInfo)
        .catch((err) => this.logger.warn(`Failed to save checkout address for user ${userId}: ${(err as Error).message}`));
    }

    // COD orders are "paid" on creation, so confirm right away. Gateway orders
    // (MoMo) are confirmed later by the IPN / confirm flow instead.
    if (order.isPaid && order.user?.email) {
      this.email.sendOrderConfirmation(order.user.email, order.id, order.totalAmount).catch(() => {});
    }
    return order;
  }

  // ── Guest checkout (cart lives in localStorage, sent in body) ────────────────
  async createFromGuestItems(body: GuestCheckoutDto) {
    if (!body.items.length) throw new BadRequestException('Cart is empty');
    assertMethod(body.paymentMethod);

    const products = await this.prisma.product.findMany({
      where: { id: { in: body.items.map((i) => i.productId) }, isPublished: true },
      include: { category: { select: { name: true } } },
    });

    const cartItems = body.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Product not found: ${item.productId}`);
      const cap = maxQtyFor(product.category?.name);
      if (item.quantity > cap)
        throw new BadRequestException(`Maximum ${cap} per order for ${product.category?.name ?? product.name}`);
      return { product, quantity: item.quantity, price: product.salePrice ?? product.price };
    });

    const subTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingFee = shippingFor(subTotal);
    const totalAmount = subTotal + shippingFee;

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
          shippingFee,
          totalAmount,
          paymentMethod: body.paymentMethod,
          shippingInfo: body.shippingInfo as unknown as Prisma.InputJsonObject,
          // COD needs no payment gate, but still needs a staff Accept/Reject
          // before fulfillment (e.g. inventory turns out unavailable) — MoMo
          // only reaches AWAITING_CONFIRMATION once payment actually clears
          // (see PaymentsService.markOrderPaid).
          status: body.paymentMethod === 'COD' ? OrderStatus.AWAITING_CONFIRMATION : OrderStatus.PENDING,
          isPaid: body.paymentMethod === 'COD',
          items: {
            create: cartItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              priceAtBuy: item.price,
            })),
          },
        },
        include: { items: ORDER_ITEMS_WITH_PRODUCT },
      });

      return created;
    });

    this.logger.log(`Guest order ${order.id} — total ${order.totalAmount} — method ${body.paymentMethod}`);
    if (order.isPaid && body.guestEmail) {
      this.email.sendOrderConfirmation(body.guestEmail, order.id, order.totalAmount).catch(() => {});
    }
    return order;
  }

  // Attach past guest orders (userId: null, guestEmail: X) to the account that
  // just logged in/registered with that same email — called from every login
  // path (email, register, Google) so guest order history isn't permanently
  // orphaned. Uses the account's own verified email (from the DB), never a
  // client-supplied one, so a caller can't claim someone else's guest orders.
  // Idempotent: once claimed, userId is set so re-running matches nothing more.
  async claimGuestOrders(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) return { claimed: 0 };
    const result = await this.prisma.order.updateMany({
      where: { userId: null, guestEmail: user.email },
      data: { userId },
    });
    return { claimed: result.count };
  }

  // Public "track my order" lookup for guests — no account, no login. Scoped
  // to userId: null so it can never become a backdoor for looking up a
  // registered user's order without logging in. Both orderId and phone must
  // match, and the error is identical either way so it can't be used to
  // enumerate valid order IDs (can't tell "no such order" from "wrong phone").
  async trackGuestOrder(orderId: string, phone: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: null },
      select: {
        id: true, status: true, isPaid: true, paymentMethod: true,
        subTotal: true, discount: true, shippingFee: true, totalAmount: true,
        createdAt: true, shippingInfo: true,
        items: ORDER_ITEMS_WITH_PRODUCT_SUMMARY,
      },
    });
    const shippingPhone = (order?.shippingInfo as { phone?: string } | null)?.phone;
    if (!order || shippingPhone?.trim() !== phone.trim()) {
      throw new NotFoundException('Order not found. Check your order ID and phone number.');
    }
    return order;
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: ORDER_ITEMS_WITH_PRODUCT_SUMMARY,
      },
    });
  }

  async getOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: ORDER_ITEMS_WITH_PRODUCT },
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
    // COD's isPaid=true is set at creation as "no gateway needed", not "cash
    // has changed hands" — that only happens on delivery — so it must stay
    // cancellable. Only a genuinely gateway-paid MoMo order is blocked here;
    // it needs a real refund, which only an admin can process.
    if (order.paymentMethod === 'MOMO' && order.isPaid) throw new BadRequestException('Cannot cancel a paid order');
    if (!['PENDING', 'AWAITING_CONFIRMATION', 'PROCESSING'].includes(order.status))
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
