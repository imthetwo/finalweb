import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [revenueAgg, orderCount, userCount, productCount, recentOrders] =
      await Promise.all([
        // Excludes CANCELLED so a cancelled COD order (isPaid=true was only ever
        // "no gateway needed", never confirmation cash was collected) can't
        // still count toward revenue.
        this.prisma.order.aggregate({
          where: { isPaid: true, status: { not: OrderStatus.CANCELLED } },
          _sum: { totalAmount: true },
        }),
        this.prisma.order.count(),
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: { user: { select: { fullName: true, email: true } } },
        }),
      ]);

    return {
      totalRevenue: revenueAgg._sum.totalAmount ?? 0,
      orderCount,
      userCount,
      productCount,
      recentOrders,
    };
  }
}
