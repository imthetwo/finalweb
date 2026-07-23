import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfirmGuestCheckoutDto, GuestCheckoutDto } from './dto/guest-checkout.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { TrackOrderDto } from './dto/track-order.dto';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string } };

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── Guest checkout — no auth required ────────────────────────────────────────
  // Cart lives in localStorage (client "session"), items sent in request body.
  // Doesn't create the Order yet — emails a confirmation link first, so a
  // typo'd or someone-else's email can't place a real order. Throttled since
  // each call sends an email to an address we haven't verified yet.
  @Post('guest-checkout')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  requestGuestCheckout(@Body() dto: GuestCheckoutDto) {
    return this.ordersService.requestGuestCheckout(dto);
  }

  // ── Guest checkout confirmation — called from the emailed link's page ────────
  // This is what actually validates stock and creates the Order.
  @Post('guest-checkout/confirm')
  confirmGuestCheckout(@Body() dto: ConfirmGuestCheckoutDto) {
    return this.ordersService.confirmGuestCheckout(dto.token);
  }

  // ── Polled by the original checkout tab while showing "check your email" ─────
  // Keyed by pendingId (not the token), so it can only report status, never
  // complete the confirmation — lets that tab auto-redirect once the guest
  // confirms via the emailed link, even from a different tab/device.
  @Get('guest-checkout/status/:pendingId')
  guestCheckoutStatus(@Param('pendingId') pendingId: string) {
    return this.ordersService.getGuestCheckoutStatus(pendingId);
  }

  // ── Guest "track my order" lookup — no auth, orderId + phone must match ──
  // Throttled: phone is the only proof of ownership here, and it's a short,
  // guessable string — an unlimited endpoint would let someone brute-force
  // phone numbers against a known/guessed order id.
  @Post('track')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  trackOrder(@Body() dto: TrackOrderDto) {
    return this.ordersService.trackGuestOrder(dto.orderId, dto.phone);
  }

  // ── Guest self-cancel — same orderId+phone proof as the lookup above ─────
  // Same brute-force concern as /track, but the consequence here is a real
  // state change (cancel + restock), so the limit is tighter.
  @Post('track/cancel')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  cancelGuestOrder(@Body() dto: TrackOrderDto) {
    return this.ordersService.cancelGuestOrder(dto.orderId, dto.phone);
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
