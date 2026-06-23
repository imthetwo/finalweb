import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: string) {
    const [reviews, agg] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, avatarUrl: true } } },
      }),
      this.prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);
    return {
      reviews,
      average: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      count: agg._count.id,
    };
  }

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isPublished: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const already = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (already) throw new ConflictException('You have already reviewed this product');

    // isVerifiedBuy: kiểm tra user đã mua sản phẩm này chưa
    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: { userId, status: 'DELIVERED' },
      },
    });

    return this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        text: dto.text,
        isVerifiedBuy: Boolean(purchased),
      },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
    });
  }

  async deleteOwn(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.userId !== userId) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id: reviewId } });
    return { ok: true };
  }
}
