import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminOrdersExportService {
  constructor(private readonly prisma: PrismaService) {}

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
        // A cancelled order never had cash actually collected, regardless of
        // any stale isPaid left over on rows cancelled before this check existed.
        isPaid: o.status !== OrderStatus.CANCELLED && o.isPaid ? 'Yes' : 'No',
        status: o.status,
        createdAt: o.createdAt.toLocaleString('en-GB'),
      });
    }

    return wb.xlsx.writeBuffer();
  }
}
