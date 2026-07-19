import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { PaymentsService } from '../../payments/payments.service';

const VALID_STATUSES = Object.values(OrderStatus);

// Routine shipping-progress statuses, assignable via the generic status
// endpoint (open to STAFF + ADMIN). CANCELLED is deliberately excluded here —
// cancellation always goes through the dedicated cancelOrder() below, which
// is ADMIN-only and requires a reason, since it triggers a stock rollback.
const ASSIGNABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

// Reused Prisma include shape — kept in one place so the various order
// lookups below can't drift out of sync with each other.
const ORDER_WITH_USER_EMAIL = { user: { select: { email: true } } } as const;

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly payments: PaymentsService,
  ) {}

  // ── Orders ────────────────────────────────────────────────
  async listOrders(params: { status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const where: Prisma.OrderWhereInput =
      params.status && VALID_STATUSES.includes(params.status as OrderStatus)
        ? { status: params.status as OrderStatus }
        : {};

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: {
          user: { select: { fullName: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateOrderStatus(orderId: string, status: string) {
    if (!ASSIGNABLE_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException(
        'Invalid status. Use the Cancel action to cancel an order.',
      );
    }
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_WITH_USER_EMAIL,
    });
    if (!order) throw new NotFoundException('Order not found');
    // A cancelled order already had its stock restored, and a delivered order
    // is done — neither may be reassigned back into the active pipeline here,
    // or the restored stock would be double-counted (sold once, sitting back
    // in inventory, and committed to this reactivated order at the same time).
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException(`Cannot change the status of a ${order.status.toLowerCase()} order.`);
    }
    // An order awaiting confirmation hasn't been accepted into the fulfillment
    // pipeline yet — it can only go forward via acceptOrder() or backward via
    // rejectOrder(), never through this generic status bump.
    if (order.status === OrderStatus.AWAITING_CONFIRMATION) {
      throw new BadRequestException('This order is awaiting confirmation. Use Accept or Reject.');
    }
    // MoMo orders must be confirmed paid (via IPN or Recheck Payment) before
    // moving forward in the fulfillment pipeline — COD is unaffected, since it
    // is expected to stay unpaid until cash is collected on delivery.
    if (order.paymentMethod === 'MOMO' && !order.isPaid && status !== OrderStatus.PENDING) {
      throw new BadRequestException('This MoMo order has not been paid yet. Use Recheck Payment first.');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });

    const recipient = order.user?.email ?? order.guestEmail;
    if (recipient) {
      this.email.sendOrderStatusUpdate(recipient, orderId, status).catch(() => {});
    }
    return updated;
  }

  // ADMIN ONLY — cancel + restock inventory atomically, with a required
  // reason for the audit trail (logged server-side; see the reasoning behind
  // this split in the module comment above ASSIGNABLE_STATUSES).
  async cancelOrder(orderId: string, reason: string, actorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { ...ORDER_WITH_USER_EMAIL, items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Order is already cancelled');
    if (order.status === OrderStatus.DELIVERED) throw new BadRequestException('Cannot cancel a delivered order');
    // Only MoMo orders need the dedicated Refund action first — COD's
    // isPaid=true is set at order creation as "no gateway needed", not "cash
    // has actually changed hands" (that only happens on delivery), so a COD
    // order must stay freely cancellable. A genuinely-paid MoMo order must go
    // through refundOrder() instead, or it'd restock while leaving isPaid=true
    // with no refund record — an unrecoverable "cancelled but still paid" state.
    if (order.paymentMethod === 'MOMO' && order.isPaid) {
      throw new BadRequestException('This order has already been paid. Use the Refund action instead.');
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
        data: { status: OrderStatus.CANCELLED },
      });
    });

    this.logger.log(`Order ${orderId} cancelled by admin ${actorId} — reason: ${reason}`);

    const recipient = order.user?.email ?? order.guestEmail;
    if (recipient) {
      this.email.sendOrderStatusUpdate(recipient, orderId, OrderStatus.CANCELLED).catch(() => {});
    }
    return updated;
  }

  // STAFF + ADMIN — confirms a freshly-paid (or COD) order can actually be
  // fulfilled and moves it into the normal pipeline. Purely operational
  // (like the shipping-progress statuses), so it doesn't need ADMIN-only
  // gating the way Reject does.
  async acceptOrder(orderId: string, actorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_WITH_USER_EMAIL,
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.AWAITING_CONFIRMATION) {
      throw new BadRequestException('Only orders awaiting confirmation can be accepted.');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PROCESSING },
    });

    this.logger.log(`Order ${orderId} accepted by ${actorId}`);
    const recipient = order.user?.email ?? order.guestEmail;
    if (recipient) {
      this.email.sendOrderStatusUpdate(recipient, orderId, OrderStatus.PROCESSING).catch(() => {});
    }
    return updated;
  }

  // ADMIN ONLY — order can't be fulfilled (e.g. stock mismatch). Reason required
  // for audit. Auto-picks remediation: refunds via MoMo first if actually paid,
  // otherwise just cancels + restocks.
  async rejectOrder(orderId: string, reason: string, actorId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.AWAITING_CONFIRMATION) {
      throw new BadRequestException('Only orders awaiting confirmation can be rejected.');
    }

    if (order.paymentMethod === 'MOMO' && order.isPaid) {
      return this.payments.refundPayment(orderId, reason, actorId);
    }
    return this.cancelOrder(orderId, reason, actorId);
  }

  // ── Users ─────────────────────────────────────────────────
  listUsers(params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 50, 200);
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, email: true, fullName: true,
        role: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    });
  }

  async updateUserRole(userId: string, role: Role, requesterId: string) {
    if (userId === requesterId) throw new BadRequestException('Cannot change your own role');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }

  // ── Excel export ──────────────────────────────────────────
  async exportOrdersExcel(): Promise<ExcelJS.Buffer> {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } } },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Orders');
    ws.columns = [
      { header: 'Order ID',    key: 'id',            width: 16 },
      { header: 'Customer',    key: 'customer',       width: 24 },
      { header: 'Email',       key: 'email',          width: 28 },
      { header: 'Total (VND)', key: 'total',          width: 18 },
      { header: 'Payment',     key: 'paymentMethod',  width: 14 },
      { header: 'Paid',        key: 'isPaid',         width: 10 },
      { header: 'Status',      key: 'status',         width: 16 },
      { header: 'Created at',  key: 'createdAt',      width: 22 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const o of orders) {
      ws.addRow({
        id: o.id.slice(0, 8).toUpperCase(),
        customer: o.user?.fullName ?? '—',
        email: o.user?.email ?? '—',
        total: o.totalAmount,
        paymentMethod: o.paymentMethod,
        isPaid: o.isPaid ? 'Yes' : 'No',
        status: o.status,
        createdAt: o.createdAt.toLocaleString('en-GB'),
      });
    }

    return wb.xlsx.writeBuffer();
  }
}
