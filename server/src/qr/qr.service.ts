import { Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { getClientUrl } from '../common/client-url';

@Injectable()
export class QrService {
  constructor(private readonly prisma: PrismaService) {}

  private base() {
    return getClientUrl();
  }

  async orderQr(orderId: string) {
    // No auth guard here by design — guests need this right after checkout,
    // with no account to log into. So the response must never carry anything
    // beyond what generating the QR code itself needs: no status, no total.
    // Anyone wanting the real order details still has to go through
    // trackGuestOrder(), which requires the phone number too.
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const url = `${this.base()}/track-order/${order.id}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 1 });
    return { orderId: order.id, url, dataUrl };
  }

  async productQr(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const url = `${this.base()}/product/${product.id}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 1 });
    return { id: product.id, name: product.name, url, dataUrl };
  }
}
