import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// ── MoMo sandbox credentials (override via .env) ────────────────────────────
const MOMO_ENDPOINT =
  process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
const PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const ACCESS_KEY   = process.env.MOMO_ACCESS_KEY   || 'F8BBA842ECF85';
const SECRET_KEY   = process.env.MOMO_SECRET_KEY   || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';

// ── MoMo IPN response body shape ────────────────────────────────────────────
export interface MomoIpnBody {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
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

  // ── 1. Initiate payment — calls MoMo API, returns qrCodeUrl ─────────────
  async initiate(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.isPaid) throw new BadRequestException('Order has already been paid');

    const clientUrl  = process.env.CLIENT_URL  || 'http://localhost:3000';
    const serverUrl  = process.env.API_PUBLIC_URL || 'http://localhost:3001';

    // MoMo orderId must be unique + ≤ 50 chars
    const momoOrderId = `PEC-${order.id.replace(/-/g, '').slice(0, 20)}-${Date.now()}`;
    const requestId   = `${PARTNER_CODE}${Date.now()}`;
    const orderInfo   = `Pecify order ${order.id.slice(0, 8).toUpperCase()}`;
    const redirectUrl = `${clientUrl}/payment/momo?orderId=${order.id}`;
    const ipnUrl      = `${serverUrl}/payments/momo/ipn`;
    const extraData   = '';
    const requestType = 'captureWallet';
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

      // Store momoOrderId so IPN can look up our internal orderId
      await this.prisma.order.update({
        where: { id: order.id },
        data: { isPaid: false },
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
  async handleMomoIpn(body: MomoIpnBody) {
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
      where: { id: body.orderId },
      include: { items: true, user: { select: { email: true } } },
    });

    if (!order) {
      this.logger.warn(`MoMo IPN: order not found for momoOrderId=${body.orderId}`);
      return { resultCode: 0, message: 'ok' }; // always 200 to MoMo
    }

    if (order.isPaid) return { resultCode: 0, message: 'already paid' };

    if (body.resultCode === 0) {
      // Payment success
      await this.prisma.order.update({
        where: { id: order.id },
        data: { isPaid: true, status: OrderStatus.PROCESSING },
      });
      this.logger.log(`Order ${order.id} marked PAID via MoMo IPN (transId=${body.transId})`);

      if (order.user?.email) {
        this.email
          .sendOrderConfirmation(order.user.email, order.id, order.totalAmount)
          .catch(() => {});
      }
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

  // ── 3. Manual confirm (simulated / fallback) ─────────────────────────────
  async confirm(userId: string, orderId: string, success: boolean) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, user: { select: { email: true } } },
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

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { isPaid: true, status: OrderStatus.PROCESSING },
    });

    if (order.user?.email) {
      this.email
        .sendOrderConfirmation(order.user.email, order.id, order.totalAmount)
        .catch(() => {});
    }

    return { ok: true, status: updated.status, isPaid: true };
  }

  // ── 4. Status poll — frontend polls this while showing QR ───────────────
  async getStatus(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, isPaid: true, status: true, totalAmount: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return { orderId: order.id, isPaid: order.isPaid, status: order.status };
  }
}
