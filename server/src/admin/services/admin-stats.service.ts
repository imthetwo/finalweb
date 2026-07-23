import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [revenueAgg, orderCount, userCount, productCount, recentOrders] =
      await Promise.all([
        // A COD order's isPaid=true is set at creation just to mean "no
        // gateway needed" — cash hasn't actually changed hands until the
        // courier delivers it (see the same rule already applied in the
        // guest track page, Account Orders, and the admin orders table). So
        // this can't just be `isPaid: true, status not CANCELLED` — that
        // would count a COD order sitting in AWAITING_CONFIRMATION (never
        // shipped, no cash collected) as revenue. A MoMo order's isPaid=true
        // is real from the moment the gateway confirms it, at any status.
        this.prisma.order.aggregate({
          where: {
            isPaid: true,
            OR: [
              { paymentMethod: { not: 'COD' } },
              { paymentMethod: 'COD', status: OrderStatus.DELIVERED },
            ],
          },
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
