import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { TrackOrderDto } from './dto/track-order.dto';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string } };

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── Guest checkout — no auth required ────────────────────────────────────────
  // Cart lives in localStorage (client "session"), items sent in request body.
  // Backend: validate stock → $transaction(Order + OrderItem) → clear handled by client.
  @Post('guest-checkout')
  guestCheckout(@Body() dto: GuestCheckoutDto) {
    return this.ordersService.createFromGuestItems(dto);
  }

  // ── Guest "track my order" lookup — no auth, orderId + phone must match ──
  @Post('track')
  trackOrder(@Body() dto: TrackOrderDto) {
    return this.ordersService.trackGuestOrder(dto.orderId, dto.phone);
  }

  // ── Authenticated routes ──────────────────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthedRequest, @Body() body: CreateOrderDto) {
    return this.ordersService.createFromCart(req.user.userId, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Req() req: AuthedRequest) {
    return this.ordersService.listForUser(req.user.userId);
  }

  // Attach past guest orders placed with this account's email — called once
  // right after login/register/Google sign-in.
  @Post('claim')
  @UseGuards(JwtAuthGuard)
  claim(@Req() req: AuthedRequest) {
    return this.ordersService.claimGuestOrders(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  one(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ordersService.getOne(req.user.userId, id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ordersService.cancel(req.user.userId, id);
  }
}
