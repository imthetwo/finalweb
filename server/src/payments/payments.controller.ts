import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { MomoIpnBody } from './payments.service';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // ── Initiate MoMo payment → returns qrCodeUrl + payUrl ──
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  initiate(
    @CurrentUser('userId') userId: string,
    @Body() body: { orderId: string },
  ) {
    return this.payments.initiate(userId, body.orderId);
  }

  // ── MoMo IPN webhook (called by MoMo server — no auth guard) ──
  @Post('momo/ipn')
  momoIpn(@Body() body: MomoIpnBody) {
    return this.payments.handleMomoIpn(body);
  }

  // ── Frontend polls this every ~3 s while QR is displayed ──
  @Get('status/:orderId')
  @UseGuards(JwtAuthGuard)
  status(
    @CurrentUser('userId') userId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.payments.getStatus(userId, orderId);
  }

  // ── Manual confirm (simulated gateway fallback) ──
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  confirm(
    @CurrentUser('userId') userId: string,
    @Body() body: ConfirmPaymentDto,
  ) {
    return this.payments.confirm(userId, body.orderId, body.success);
  }
}
