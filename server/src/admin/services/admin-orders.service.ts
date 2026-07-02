import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';

const VALID_STATUSES = Object.values(OrderStatus);

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
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
    if (!VALID_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException('Invalid status');
    }
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });

    if (order.user?.email) {
      this.email.sendOrderStatusUpdate(order.user.email, orderId, status).catch(() => {});
    }
    return updated;
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
        role: true, isActive: true, createdAt: true,
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
