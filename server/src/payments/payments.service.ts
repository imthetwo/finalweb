import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
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
  console.warn('[PaymentsService] MOMO_SECRET_KEY is not set — MoMo payments will fail. Set it in .env to enable real payments.');
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  // ── Helper: HMAC-SHA256 ──────────────────────────────────────────────────
  private sign(rawSignature: string): string {
    return crypto.createHmac('sha256', SECRET_KEY).update(rawSignature).digest('hex');
  }

  // ── Helper: atomically flip an order to PAID + send confirmation email ──
  // Shared by the IPN webhook and the admin force-poll — both are just
  // different ways of learning the same fact from MoMo, so both must apply it
  // identically. Returns false if the order was already paid (no-op).
  private async markOrderPaid(
    order: { id: string; totalAmount: number; guestEmail: string | null; user: { email: string | null } | null },
    transId: number | null,
    source: 'ipn' | 'force-poll',
  ): Promise<boolean> {
    const updated = await this.prisma.order.updateMany({
      // status: { not: CANCELLED } is the real backstop here — atomic, so no
      // race condition can slip a payment through onto an order whose stock
      // was already restored. The explicit CANCELLED check in forcePollPayment
      // is just an earlier, friendlier error before wasting a MoMo API call;
      // this is what actually protects the IPN webhook path too.
      where: { id: order.id, isPaid: false, status: { not: OrderStatus.CANCELLED } },
      // transId is stored so a later refund can reference the exact MoMo
      // transaction — MoMo's refund API requires it, and it's otherwise never
      // persisted anywhere. Lands in AWAITING_CONFIRMATION, not PROCESSING —
      // payment clearing doesn't mean staff have confirmed they can actually
      // fulfill it (see AdminOrdersService.acceptOrder/rejectOrder).
      data: { isPaid: true, status: OrderStatus.AWAITING_CONFIRMATION, momoTransId: transId != null ? String(transId) : undefined },
    });
    if (updated.count === 0) return false;

    this.logger.log(`Order ${order.id} marked PAID via ${source} (transId=${transId ?? 'n/a'})`);

    const recipient = order.user?.email ?? order.guestEmail;
    if (recipient) {
      this.email.sendOrderConfirmation(recipient, order.id, order.totalAmount).catch(() => {});
    }
    return true;
  }

  // ── 1. Initiate payment — calls MoMo API, returns qrCodeUrl ─────────────
  // userId=null → guest: may only pay guest orders (userId IS NULL in the DB).
  async initiate(userId: string | null, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.isPaid) throw new BadRequestException('Order has already been paid');
    // Without this, a stale payment-gateway tab (or a reloaded link) for an
    // order that was since cancelled would silently open a fresh, live MoMo
    // session for it — and if that payment actually completed, the IPN/force-
    // poll path would reactivate a cancelled+restocked order (see the where
    // guard in markOrderPaid below for the matching backstop).
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('This order has been cancelled and can no longer be paid.');

    const clientUrl  = getClientUrl();
    const serverUrl  = process.env.API_PUBLIC_URL || 'http://localhost:3001';

    // MoMo orderId must be unique + ≤ 50 chars
    const momoOrderId = `PEC-${order.id.replace(/-/g, '').slice(0, 20)}-${crypto.randomBytes(4).toString('hex')}`;
    const requestId   = `${PARTNER_CODE}${Date.now()}`;
    const orderInfo   = `Pecify order ${order.id.slice(0, 8).toUpperCase()}`;
    const redirectUrl = `${clientUrl}/payment/momo?orderId=${order.id}`;
    const ipnUrl      = `${serverUrl}/payments/momo/ipn`;
    const extraData   = '';
    // payWithATM = MoMo's hosted checkout with ONLY domestic ATM card payment —
    // no wallet/QR option at all. (Use 'payWithCC' for Visa/Master/JCB only, or
    // 'payWithMethod' to offer every method including the MoMo wallet.)
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
      include: { items: true, user: { select: { email: true } } },
    });

    if (!order) {
      this.logger.warn(`MoMo IPN: order not found for momoOrderId=${body.orderId}`);
      return { resultCode: 0, message: 'ok' }; // always 200 to MoMo
    }

    if (body.resultCode === 0) {
      const changed = await this.markOrderPaid(order, body.transId, 'ipn');
      if (!changed) return { resultCode: 0, message: 'already paid' };
    } else {
      // Payment failed
      await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });
      });
      this.logger.warn(`Order ${order.id} PAYMENT_FAILED via MoMo IPN (code=${body.resultCode})`);
    }

    return { resultCode: 0, message: 'ok' };
  }

  // ── 2b. Admin "Force Poll" — on-demand recheck against MoMo's own query API.
  // Fixes the IPN-lag/loss scenario: the customer's money was taken but our
  // webhook never arrived (or was dropped), so the order sits stuck as
  // unpaid. This only ever moves an order TOWARD paid — a non-success result
  // here is reported back as-is and never auto-cancels anything, so a flaky
  // query call can't accidentally cancel a genuinely pending order. ──────────
  async forcePollPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentMethod !== 'MOMO') throw new BadRequestException('Only MoMo orders can be rechecked.');
    if (order.isPaid) return { orderId: order.id, isPaid: true, status: order.status, momoResultCode: 0, momoMessage: 'Already paid' };
    // A cancelled order already had its stock restored — marking it paid here
    // would reactivate it without ever re-decrementing that stock. A late
    // MoMo confirmation on a cancelled order needs a manual refund, not an
    // automatic reactivation.
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('This order was cancelled. If MoMo shows it as paid, process a refund manually — do not reactivate it.');
    }
    if (!order.momoOrderId) throw new BadRequestException('This order has no MoMo transaction to check yet.');

    const requestId = `${PARTNER_CODE}${Date.now()}`;
    const rawSig = [
      `accessKey=${ACCESS_KEY}`,
      `orderId=${order.momoOrderId}`,
      `partnerCode=${PARTNER_CODE}`,
      `requestId=${requestId}`,
    ].join('&');

    const res = await fetch(MOMO_QUERY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        partnerCode: PARTNER_CODE,
        requestId,
        orderId: order.momoOrderId,
        signature: this.sign(rawSig),
        lang: 'vi',
      }),
    });

    const data = (await res.json()) as { resultCode: number; message: string; transId?: number };
    this.logger.log(`Force-poll MoMo query for order ${order.id}: resultCode=${data.resultCode} — ${data.message}`);

    if (data.resultCode === 0) {
      await this.markOrderPaid(order, data.transId ?? null, 'force-poll');
      return { orderId: order.id, isPaid: true, status: OrderStatus.AWAITING_CONFIRMATION, momoResultCode: data.resultCode, momoMessage: data.message };
    }

    return { orderId: order.id, isPaid: false, status: order.status, momoResultCode: data.resultCode, momoMessage: data.message };
  }

  // ── 2c. Admin "Refund" — calls MoMo's real refund API for a paid order,
  // and only on a confirmed success does it restock + cancel the order. If
  // MoMo rejects the refund, nothing changes (order stays paid, untouched) —
  // this must never restock/cancel speculatively. ──────────────────────────
  async refundPayment(orderId: string, reason: string, actorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } }, items: true },
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
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED, isPaid: false, refundedAt: new Date() },
      });
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
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.isPaid) return { ok: true, alreadyPaid: true };

    if (!success) {
      await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.CANCELLED } });
      });
      return { ok: false, status: OrderStatus.CANCELLED };
    }

    throw new BadRequestException('This order must be paid through the MoMo gateway.');
  }

  // ── 4. Status poll — frontend polls this while showing QR ───────────────
  async getStatus(userId: string | null, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, isPaid: true, status: true, totalAmount: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return { orderId: order.id, isPaid: order.isPaid, status: order.status, totalAmount: order.totalAmount };
  }
}
