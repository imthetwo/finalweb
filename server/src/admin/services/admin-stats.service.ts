import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [revenueAgg, orderCount, userCount, productCount, recentOrders] =
      await Promise.all([
        this.prisma.order.aggregate({ where: { isPaid: true }, _sum: { totalAmount: true } }),
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
