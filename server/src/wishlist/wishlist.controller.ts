import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser('userId') userId: string) {
    return this.wishlist.list(userId);
  }

  @Post()
  add(@CurrentUser('userId') userId: string, @Body() body: { productId: string }) {
    return this.wishlist.add(userId, body.productId);
  }

  @Delete(':productId')
  remove(@CurrentUser('userId') userId: string, @Param('productId') productId: string) {
    return this.wishlist.remove(userId, productId);
  }
}
