import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(code: string, subtotal: number) {
    if (!code?.trim()) return { valid: false, discount: 0, message: 'No coupon code provided.' };

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive)
      return { valid: false, discount: 0, message: 'Coupon code not found or expired.' };

    if (coupon.validUntil && coupon.validUntil < new Date())
      return { valid: false, discount: 0, message: 'Coupon has expired.' };

    if (coupon.usedCount >= coupon.maxUse)
      return { valid: false, discount: 0, message: 'Coupon usage limit reached.' };

    if (subtotal < coupon.minOrderValue)
      return {
        valid: false,
        discount: 0,
        message: `Minimum order value is ${coupon.minOrderValue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}`,
      };

    const discount = coupon.discountFixed
      ? Math.min(coupon.discountFixed, subtotal)
      : Math.round((subtotal * (coupon.discountPct ?? 0)) / 100 * 100) / 100;

    return { valid: true, discount, message: 'Coupon applied!', code: coupon.code };
  }

  async markUsed(code: string) {
    await this.prisma.coupon.updateMany({
      where: { code: code.trim().toUpperCase() },
      data: { usedCount: { increment: 1 } },
    });
  }
}
