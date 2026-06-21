import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  private uid(req: Request & { user: { userId: string } }) {
    return req.user.userId;
  }

  @Post()
  create(
    @Req() req: Request & { user: { userId: string } },
    @Body()
    body: {
      shippingInfo: Record<string, string>;
      paymentMethod: string;
      couponCode?: string;
    },
  ) {
    return this.ordersService.createFromCart(this.uid(req), body);
  }

  @Get()
  list(@Req() req: Request & { user: { userId: string } }) {
    return this.ordersService.listForUser(this.uid(req));
  }

  @Get(':id')
  one(@Req() req: Request & { user: { userId: string } }, @Param('id') id: string) {
    return this.ordersService.getOne(this.uid(req), id);
  }

  @Post(':id/cancel')
  cancel(@Req() req: Request & { user: { userId: string } }, @Param('id') id: string) {
    return this.ordersService.cancel(this.uid(req), id);
  }
}
