import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { EmailService } from '../email/email.service';
import { GuestCartItemDto, GuestCheckoutDto } from './dto/guest-checkout.dto';
import { ShippingInfoDto } from './dto/shipping-info.dto';
import { maxQtyFor } from '../common/quantity-caps';
import { effectivePrice } from '../common/pricing';
import { AddressesService } from '../addresses/addresses.service';

const PENDING_GUEST_ORDER_TTL_MS = 30 * 60 * 1000; // 30 minutes

const SHIPPING_FEE = 30000;          // flat shipping rate (VND)
const FREE_SHIPPING_OVER = 2000000;  // free shipping threshold (VND)
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
  // Split into request → confirm so a guest must actually own the email they
  // typed before an Order (and its stock decrement) is ever created — a typo'd
  // or someone-else's email can no longer place a real order. No stock is
  // reserved while the confirmation is pending, so an email that's never
  // opened can't hold inventory hostage.
  async requestGuestCheckout(body: GuestCheckoutDto) {
    if (!body.items.length) throw new BadRequestException('Cart is empty');
    assertMethod(body.paymentMethod);

    // No cron in this project — piggyback on checkout traffic itself to keep
    // abandoned/expired pending rows from accumulating forever. Only ever
    // touches rows nobody can act on anymore (past expiry, never confirmed),
    // so it's safe to run unconditionally on every request.
    this.prisma.pendingGuestOrder
      .deleteMany({ where: { expiresAt: { lt: new Date() }, confirmedAt: null } })
      .catch(() => {});

    const token = randomBytes(32).toString('hex');
    const created = await this.prisma.pendingGuestOrder.create({
      data: {
        token,
        email: body.guestEmail,
        items: body.items as unknown as Prisma.InputJsonValue,
        shippingInfo: body.shippingInfo as unknown as Prisma.InputJsonValue,
        paymentMethod: body.paymentMethod,
        expiresAt: new Date(Date.now() + PENDING_GUEST_ORDER_TTL_MS),
      },
    });

    this.email.sendGuestOrderConfirmation(body.guestEmail, token).catch(() => {});
    // pendingId (NOT the token) is safe to hand back to the tab that just
    // submitted — it only ever reveals confirm/not-confirmed status (see
    // getGuestCheckoutStatus below), never lets that tab complete the
    // confirmation itself. Lets the original checkout tab poll and redirect
    // on its own once the guest confirms via the emailed link, even if they
    // open that link on a different device or tab.
    return { pending: true as const, email: body.guestEmail, pendingId: created.id };
  }

  // Polled by the original checkout tab while it shows "check your email" —
  // deliberately keyed by pendingId, not the token, so it can only ever
  // report status, never trigger the actual confirmation itself.
  async getGuestCheckoutStatus(pendingId: string) {
    const pending = await this.prisma.pendingGuestOrder.findUnique({ where: { id: pendingId } });
    if (!pending) throw new NotFoundException('Not found');
    return { confirmed: !!pending.orderId, orderId: pending.orderId };
  }

  // Called from the /guest-checkout/confirm page after the guest clicks the
  // emailed link — this is what actually validates stock and creates the Order.
  async confirmGuestCheckout(token: string) {
    const pending = await this.prisma.pendingGuestOrder.findUnique({ where: { token } });
    if (!pending) throw new BadRequestException('Invalid or expired confirmation link');
    if (pending.expiresAt < new Date()) {
      throw new BadRequestException('This confirmation link has expired — please check out again.');
    }

    // Atomic guard, claimed BEFORE the order is created — so a duplicate
    // confirm (double-click, an email client prefetching the link) can't
    // create two separate orders for the same pending checkout.
    const claimed = await this.prisma.pendingGuestOrder.updateMany({
      where: { id: pending.id, confirmedAt: null },
      data: { confirmedAt: new Date() },
    });
    if (claimed.count === 0) {
      const fresh = await this.prisma.pendingGuestOrder.findUnique({ where: { id: pending.id } });
      if (fresh?.orderId) return this.getGuestOrder(fresh.orderId);
      throw new BadRequestException('This confirmation link is already being processed — check your email for the order confirmation in a moment.');
    }

    const order = await this.createConfirmedGuestOrder({
      items: pending.items as unknown as GuestCartItemDto[],
      shippingInfo: pending.shippingInfo as unknown as ShippingInfoDto,
      paymentMethod: pending.paymentMethod,
      guestEmail: pending.email,
    });

    await this.prisma.pendingGuestOrder.update({ where: { id: pending.id }, data: { orderId: order.id } });
    return order;
  }

  private async getGuestOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: ORDER_ITEMS_WITH_PRODUCT },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async createConfirmedGuestOrder(body: GuestCheckoutDto) {
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
      return { product, quantity: item.quantity, price: effectivePrice(product) };
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
          guestEmail: body.guestEmail,
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
    if (order.isPaid) {
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
  //
  // orderId is matched as a PREFIX, not an exact UUID — a guest never actually
  // sees the full UUID anywhere (order-success page, confirmation email, every
  // other UI surface all only ever show the first 8 hex chars), so requiring
  // an exact match made this lookup fail for basically every real guest.
  async trackGuestOrder(orderId: string, phone: string) {
    const candidates = await this.prisma.order.findMany({
      where: { id: { startsWith: orderId.trim().toLowerCase() }, userId: null },
      select: {
        id: true, status: true, isPaid: true, paymentMethod: true,
        subTotal: true, discount: true, shippingFee: true, totalAmount: true,
        createdAt: true, shippingInfo: true,
        items: ORDER_ITEMS_WITH_PRODUCT_SUMMARY,
      },
      take: 5,
    });
    const order = candidates.find((o) => {
      const shippingPhone = (o.shippingInfo as { phone?: string } | null)?.phone;
      return shippingPhone?.trim() === phone.trim();
    });
    if (!order) {
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
    const cancelled = await this.finalizeCancel(order);
    this.logger.log(`Order ${orderId} cancelled by user ${userId}`);
    return cancelled;
  }

  // Self-cancel for a guest, before an order is DELIVERED/CANCELLED — same
  // ownership proof as trackGuestOrder (orderId prefix + matching phone),
  // same cancellation rules as the logged-in cancel() above. A guest who's
  // placed an order and hasn't heard back yet shouldn't have to wait for an
  // admin to Accept/Reject it before they're allowed to change their mind.
  async cancelGuestOrder(orderId: string, phone: string) {
    const candidates = await this.prisma.order.findMany({
      where: { id: { startsWith: orderId.trim().toLowerCase() }, userId: null },
      include: { items: true },
      take: 5,
    });
    const order = candidates.find((o) => {
      const shippingPhone = (o.shippingInfo as { phone?: string } | null)?.phone;
      return shippingPhone?.trim() === phone.trim();
    });
    if (!order) throw new NotFoundException('Order not found. Check your order ID and phone number.');

    const cancelled = await this.finalizeCancel(order);
    this.logger.log(`Guest order ${order.id} cancelled (phone-verified)`);
    return cancelled;
  }

  // Shared by cancel() and cancelGuestOrder() — the caller has already
  // proven ownership by this point (userId match or orderId+phone match);
  // this is just the business rule + the atomic restock-and-cancel itself.
  private async finalizeCancel(order: {
    id: string;
    paymentMethod: string;
    isPaid: boolean;
    status: OrderStatus;
    items: { productId: string; quantity: number }[];
  }) {
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
      // isPaid: false — mirrors AdminOrdersService.cancelOrder: no cash was
      // actually collected (COD's isPaid=true at creation was only ever "no
      // gateway needed"; a paid MoMo order is blocked above).
      return tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED, isPaid: false },
      });
    });
  }
}
