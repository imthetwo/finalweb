import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private uid(req: Request & { user: { userId: string } }) {
    return req.user.userId;
  }

  @Get()
  get(@Req() req: Request & { user: { userId: string } }) {
    return this.cartService.getCart(this.uid(req));
  }

  @Post('items')
  add(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { productId: string; quantity?: number },
  ) {
    return this.cartService.addItem(this.uid(req), body.productId, body.quantity ?? 1);
  }

  @Patch('items/:id')
  update(
    @Req() req: Request & { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(this.uid(req), id, body.quantity);
  }

  @Delete('items/:id')
  remove(@Req() req: Request & { user: { userId: string } }, @Param('id') id: string) {
    return this.cartService.removeItem(this.uid(req), id);
  }

  @Delete()
  clear(@Req() req: Request & { user: { userId: string } }) {
    return this.cartService.clear(this.uid(req));
  }
}
