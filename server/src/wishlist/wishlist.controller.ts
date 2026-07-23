import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddWishlistDto } from './dto/add-wishlist.dto';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser('userId') userId: string) {
    return this.wishlist.list(userId);
  }

  @Post()
  add(@CurrentUser('userId') userId: string, @Body() dto: AddWishlistDto) {
    return this.wishlist.add(userId, dto.productId);
  }

  @Delete(':productId')
  remove(@CurrentUser('userId') userId: string, @Param('productId') productId: string) {
    return this.wishlist.remove(userId, productId);
  }
}
