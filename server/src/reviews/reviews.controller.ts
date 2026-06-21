import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('product/:productId')
  forProduct(@Param('productId') productId: string) {
    return this.reviews.findByProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(userId, dto);
  }
}
