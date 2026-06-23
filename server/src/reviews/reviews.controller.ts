import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteOwn(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.reviews.deleteOwn(userId, id);
  }
}
