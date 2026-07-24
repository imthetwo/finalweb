import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { getClientUrl } from '../common/client-url';
import type { MomoIpnDto } from './dto/momo-ipn.dto';

// ── MoMo sandbox credentials — must be set via .env ─────────────────────────
const MOMO_ENDPOINT  = process.env.MOMO_ENDPOINT  || 'https://test-payment.momo.vn/v2/gateway/api/create';
const MOMO_QUERY_ENDPOINT = process.env.MOMO_QUERY_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/query';
const MOMO_REFUND_ENDPOINT = process.env.MOMO_REFUND_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/refund';
const PARTNER_CODE   = process.env.MOMO_PARTNER_CODE || 'MOMO';
const ACCESS_KEY     = process.env.MOMO_ACCESS_KEY || '';
const SECRET_KEY     = process.env.MOMO_SECRET_KEY || '';

if (!SECRET_KEY) {
  Logger.warn('MOMO_SECRET_KEY is not set — MoMo payments will fail. Set it in .env to enable real payments.', 'PaymentsService');
}

// Reused Prisma include shapes — kept in one place so the various order
// lookups below can't drift out of sync with each other.
const ORDER_WITH_USER_EMAIL = { user: { select: { email: true } } } as const;
const ORDER_WITH_USER_EMAIL_AND_ITEMS = { ...ORDER_WITH_USER_EMAIL, items: true } as const;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  // ── Helper: order lookup filter for the payment endpoints below ──────────
  // A guest checkout auto-attaches to an existing account by matching email
  // (see OrdersService.createConfirmedGuestOrder) — so a guest who just placed
  // that order, still logged out, sends userId=null while the order itself
  // already has a real userId. Plain `{ id, userId }` would reject them from
  // paying (and later polling the status of) their own just-placed order —
  // including right after MoMo confirms it, which is exactly when the
  // frontend's poll most needs to still see it. orderId is an unguessable
  // UUID (same trust model as guest order tracking, which is orderId+phone),
  // so a guest request just needs the id to match; only a *logged-in* request
  // is scoped to that account's own orders.
  private orderAccessWhere(orderId: string, userId: string | null) {
    return userId ? { id: orderId, userId } : { id: orderId };
  }

  // ── Helper: HMAC-SHA256 ──────────────────────────────────────────────────
  private sign(rawSignature: string): string {
    return crypto.createHmac('sha256', SECRET_KEY).update(rawSignature).digest('hex');
  }

  // ── Helper: atomically flip an order to PAID + send confirmation email ──
  // Shared by the IPN webhook and admin force-poll (same fact, two sources).
  // Returns false if already paid (no-op).
  private async markOrderPaid(
    order: {
      id: string;
      totalAmount: number;
      guestEmail: string | null;
      user: { email: string | null } | null;
      shippingInfo: Prisma.JsonValue;
    },
    transId: number | null,
    source: 'ipn' | 'force-poll',
  ): Promise<boolean> {
    const updated = await this.prisma.order.updateMany({
      // Atomic guard against a cancelled (stock-restored) order getting paid —
      // this protects both IPN and force-poll; the CANCELLED check in
      // forcePollPayment is just a friendlier early error, not the real guard.
      where: { id: order.id, isPaid: false, status: { not: OrderStatus.CANCELLED } },
      // transId is saved for refunds (MoMo's refund API requires it). Status
      // goes to AWAITING_CONFIRMATION, not PROCESSING — paid isn't the same as
      // staff confirming they can fulfill it (see AdminOrdersService).
      data: { isPaid: true, status: OrderStatus.AWAITING_CONFIRMATION, momoTransId: transId != null ? String(transId) : undefined },
    });
    if (updated.count === 0) return false;

    this.logger.log(`Order ${order.id} marked PAID via ${source} (transId=${transId ?? 'n/a'})`);

    const recipient = order.user?.email ?? order.guestEmail;
    if (recipient) {
      // No account (order.user) → this is a guest order, so the confirmation
      // email needs the phone too (see EmailService.sendOrderConfirmation) —
      // a guest has no "My Orders" to fall back on, only /track-order by
      // order ID + phone.
      const guestPhone = order.user ? undefined : (order.shippingInfo as { phone?: string } | null)?.phone;
      this.email.sendOrderConfirmation(recipient, order.id, order.totalAmount, guestPhone).catch(() => {});
    }
    return true;
  }

  // ── Helper: query MoMo's own record for a momoOrderId ────────────────────
  // Shared by forcePollPayment (admin manual recheck) and initiate (checking
  // a pre-existing in-flight session before minting a new one).
  private async queryMomoStatus(momoOrderId: string): Promise<{ resultCode: number; message: string; transId?: number }> {
    const requestId = `${PARTNER_CODE}${Date.now()}`;
    const rawSig = [
      `accessKey=${ACCESS_KEY}`,
      `orderId=${momoOrderId}`,
      `partnerCode=${PARTNER_CODE}`,
      `requestId=${requestId}`,
    ].join('&');

    const res = await fetch(MOMO_QUERY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        partnerCode: PARTNER_CODE,
        requestId,
        orderId: momoOrderId,
        signature: this.sign(rawSig),
        lang: 'vi',
      }),
    });

    return (await res.json()) as { resultCode: number; message: string; transId?: number };
  }

  // ── Helper: atomically cancel + restock, guarded so a duplicate/replayed
  // call (redelivered IPN, double-click, racing another cancel path) can
  // only ever restock once. Mirrors markOrderPaid's atomic-guard pattern.
  // Returns false if the order was already paid or already cancelled.
  private async cancelAndRestock(order: { id: string; items: { productId: string; quantity: number }[] }): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const guard = await tx.order.updateMany({
        where: { id: order.id, isPaid: false, status: { not: OrderStatus.CANCELLED } },
        data: { status: OrderStatus.CANCELLED },
      });
      if (guard.count === 0) return false;

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return true;
    });
  }

  // ── 1. Initiate payment — calls MoMo API, returns qrCodeUrl ─────────────
  async initiate(userId: string | null, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: this.orderAccessWhere(orderId, userId),
      include: ORDER_WITH_USER_EMAIL,
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.isPaid) throw new BadRequestException('Order has already been paid');
    // Blocks a stale/reloaded payment tab from opening a fresh MoMo session on
    // an order that's since been cancelled (markOrderPaid's where-guard above
    // is the backstop if one somehow still completes).
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('This order has been cancelled and can no longer be paid.');

    // A previous MoMo session may still be outstanding for this order (e.g.
    // the browser remounts this page on MoMo's redirect back before the IPN
    // has landed). Minting a brand-new momoOrderId would overwrite the one
    // IPN needs to map the real transaction back to this order — so check
    // MoMo's own record for it first. If MoMo already processed it as paid,
    // record that now instead of orphaning a payment the customer already made.
    if (order.momoOrderId) {
      const existing = await this.queryMomoStatus(order.momoOrderId);
      if (existing.resultCode === 0) {
        await this.markOrderPaid(order, existing.transId ?? null, 'force-poll');
        throw new BadRequestException('Order has already been paid');
      }
    }

    const clientUrl  = getClientUrl();
    const serverUrl  = process.env.API_PUBLIC_URL || 'http://localhost:3001';

    // MoMo orderId must be unique + ≤ 50 chars
    const momoOrderId = `PEC-${order.id.replace(/-/g, '').slice(0, 20)}-${crypto.randomBytes(4).toString('hex')}`;
    const requestId   = `${PARTNER_CODE}${Date.now()}`;
    const orderInfo   = `Pecify order ${order.id.slice(0, 8).toUpperCase()}`;
    const redirectUrl = `${clientUrl}/payment/momo?orderId=${order.id}`;
    const ipnUrl      = `${serverUrl}/payments/momo/ipn`;
    const extraData   = '';
    // payWithATM = domestic ATM cards only, no wallet/QR ('payWithCC' = cards
    // only, 'payWithMethod' = every method including the MoMo wallet).
    const requestType = 'payWithATM';
    // Charge amount in VND (integer) — MoMo settles in VND, which is our currency.
    const amount      = Math.round(order.totalAmount);

    // Signature raw string — alphabetical field order per MoMo spec
    const rawSig = [
      `accessKey=${ACCESS_KEY}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${momoOrderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${PARTNER_CODE}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = this.sign(rawSig);

    const momoBody = {
      partnerCode: PARTNER_CODE,
      accessKey: ACCESS_KEY,
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    try {
      const res = await fetch(MOMO_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(momoBody),
      });

      const data = (await res.json()) as {
        resultCode: number;
        message: string;
        payUrl?: string;
        qrCodeUrl?: string;
        deeplink?: string;
      };

      this.logger.log(`MoMo create result: ${data.resultCode} — ${data.message}`);

      if (data.resultCode !== 0) {
        throw new BadRequestException(`MoMo error: ${data.message}`);
      }

      // Store momoOrderId so IPN can map back to our internal orderId
      await this.prisma.order.update({
        where: { id: order.id },
        data: { momoOrderId },
      });

      return {
        orderId: order.id,
        momoOrderId,
        amount,
        payUrl:     data.payUrl    ?? null,
        qrCodeUrl:  data.qrCodeUrl ?? null,
        deeplink:   data.deeplink  ?? null,
        source: 'momo' as const,
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;

      // MoMo unreachable (no internet / sandbox down) → return simulated fallback
      this.logger.warn(`MoMo API unreachable — using simulated fallback: ${(err as Error).message}`);
      const simulatedPayUrl = `${clientUrl}/payment/momo?orderId=${order.id}&amount=${amount}&simulated=1`;
      return {
        orderId: order.id,
        momoOrderId: null,
        amount,
        payUrl:    simulatedPayUrl,
        qrCodeUrl: null,
        deeplink:  null,
        source: 'simulated' as const,
      };
    }
  }

  // ── 2. MoMo IPN webhook ────────────────────────────────────────────────
  async handleMomoIpn(body: MomoIpnDto) {
    // Verify signature
    const rawSig = [
      `accessKey=${ACCESS_KEY}`,
      `amount=${body.amount}`,
      `extraData=${body.extraData}`,
      `message=${body.message}`,
      `orderId=${body.orderId}`,
      `orderInfo=${body.orderInfo}`,
      `orderType=${body.orderType}`,
      `partnerCode=${body.partnerCode}`,
      `payType=${body.payType}`,
      `requestId=${body.requestId}`,
      `responseTime=${body.responseTime}`,
      `resultCode=${body.resultCode}`,
      `transId=${body.transId}`,
    ].join('&');

    const expected = this.sign(rawSig);
    if (body.signature !== expected) {
      this.logger.warn(`MoMo IPN signature mismatch for orderId=${body.orderId}`);
      return { resultCode: 1, message: 'Signature mismatch' };
    }

    const order = await this.prisma.order.findFirst({
      where: { momoOrderId: body.orderId },
      include: ORDER_WITH_USER_EMAIL_AND_ITEMS,
    });

    if (!order) {
      this.logger.warn(`MoMo IPN: order not found for momoOrderId=${body.orderId}`);
      return { resultCode: 0, message: 'ok' }; // always 200 to MoMo
    }

    if (body.resultCode === 0) {
      const changed = await this.markOrderPaid(order, body.transId, 'ipn');
      if (!changed) return { resultCode: 0, message: 'already paid' };
    } else {
      // Payment failed — guarded so a redelivered failure IPN (webhooks are
      // at-least-once delivery) or one arriving after a success IPN already
      // paid this order can't double-restock or silently un-pay it.
      const changed = await this.cancelAndRestock(order);
      if (changed) this.logger.warn(`Order ${order.id} PAYMENT_FAILED via MoMo IPN (code=${body.resultCode})`);
    }

    return { resultCode: 0, message: 'ok' };
  }

  // ── 2b. Admin "Force Poll" — recheck payment against MoMo's query API.
  // Fixes IPN lag/loss (money taken, webhook lost). Only ever moves TOWARD
  // paid — a non-success result is just reported, never auto-cancels. ──────
  async forcePollPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_WITH_USER_EMAIL,
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentMethod !== 'MOMO') throw new BadRequestException('Only MoMo orders can be rechecked.');
    if (order.isPaid) return { orderId: order.id, isPaid: true, status: order.status, momoResultCode: 0, momoMessage: 'Already paid' };
    // Cancelled = stock already restored; marking it paid would reactivate it
    // without re-decrementing stock. Needs a manual refund, not auto-reactivation.
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('This order was cancelled. If MoMo shows it as paid, process a refund manually — do not reactivate it.');
    }
    if (!order.momoOrderId) throw new BadRequestException('This order has no MoMo transaction to check yet.');

    const data = await this.queryMomoStatus(order.momoOrderId);
    this.logger.log(`Force-poll MoMo query for order ${order.id}: resultCode=${data.resultCode} — ${data.message}`);

    if (data.resultCode === 0) {
      await this.markOrderPaid(order, data.transId ?? null, 'force-poll');
      return { orderId: order.id, isPaid: true, status: OrderStatus.AWAITING_CONFIRMATION, momoResultCode: data.resultCode, momoMessage: data.message };
    }

    return { orderId: order.id, isPaid: false, status: order.status, momoResultCode: data.resultCode, momoMessage: data.message };
  }

  // ── 2c. Admin "Refund" — calls MoMo's refund API; only restocks + cancels
  // on confirmed success. Rejected refund = order stays paid, untouched. ───
  async refundPayment(orderId: string, reason: string, actorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_WITH_USER_EMAIL_AND_ITEMS,
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Order is already cancelled');
    if (order.paymentMethod !== 'MOMO') throw new BadRequestException('Only MoMo orders can be refunded through this action.');
    if (!order.isPaid) throw new BadRequestException('Order has not been paid — use the Cancel action instead.');
    if (!order.momoTransId) throw new BadRequestException('This order has no MoMo transaction on record to refund.');

    const amount = Math.round(order.totalAmount);
    const refundOrderId = `RF-${order.id.replace(/-/g, '').slice(0, 20)}-${crypto.randomBytes(4).toString('hex')}`;
    const requestId = `${PARTNER_CODE}${Date.now()}`;
    const description = `Refund for order ${order.id.slice(0, 8).toUpperCase()}`;

    const rawSig = [
      `accessKey=${ACCESS_KEY}`,
      `amount=${amount}`,
      `description=${description}`,
      `orderId=${refundOrderId}`,
      `partnerCode=${PARTNER_CODE}`,
      `requestId=${requestId}`,
      `transId=${order.momoTransId}`,
    ].join('&');

    const res = await fetch(MOMO_REFUND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        partnerCode: PARTNER_CODE,
        orderId: refundOrderId,
        requestId,
        amount,
        transId: Number(order.momoTransId),
        lang: 'vi',
        description,
        signature: this.sign(rawSig),
      }),
    });

    const data = (await res.json()) as { resultCode: number; message: string };
    this.logger.log(`MoMo refund for order ${order.id}: resultCode=${data.resultCode} — ${data.message} (requested by admin ${actorId}, reason: ${reason})`);

    if (data.resultCode !== 0) {
      throw new BadRequestException(`MoMo refund failed: ${data.message}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Atomic guard against a duplicate/concurrent refund call (double-click,
      // two admin tabs) both reaching MoMo successfully before either writes —
      // mirrors markOrderPaid/cancelAndRestock above. The checks before the
      // MoMo call are a friendlier early error; this is what actually
      // prevents a double restock if two calls both pass those checks.
      const guard = await tx.order.updateMany({
        where: { id: orderId, isPaid: true, status: { not: OrderStatus.CANCELLED } },
        data: { status: OrderStatus.CANCELLED, isPaid: false, refundedAt: new Date() },
      });
      if (guard.count === 0) throw new BadRequestException('Order is already cancelled or refunded');

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    });

    const recipient = order.user?.email ?? order.guestEmail;
    if (recipient) {
      this.email.sendOrderStatusUpdate(recipient, orderId, OrderStatus.CANCELLED).catch(() => {});
    }
    return updated;
  }

  // ── 3. Cancel an unpaid payment (restores stock). "Success" self-confirms
  //      are rejected: orders can only be marked paid by MoMo's signed IPN. ──
  async confirm(userId: string | null, orderId: string, success: boolean) {
    const order = await this.prisma.order.findFirst({
      where: this.orderAccessWhere(orderId, userId),
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.isPaid) return { ok: true, alreadyPaid: true };

    if (!success) {
      // Guarded so a double-click or client retry firing this twice can't
      // restock the same items twice — a cancelled order stays isPaid:false
      // forever, so that check alone can't catch a duplicate call.
      await this.cancelAndRestock(order);
      return { ok: false, status: OrderStatus.CANCELLED };
    }

    throw new BadRequestException('This order must be paid through the MoMo gateway.');
  }

  // ── 4. Status poll — frontend polls this while showing QR ───────────────
  async getStatus(userId: string | null, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: this.orderAccessWhere(orderId, userId),
      select: { id: true, isPaid: true, status: true, totalAmount: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return { orderId: order.id, isPaid: order.isPaid, status: order.status, totalAmount: order.totalAmount };
  }
}
