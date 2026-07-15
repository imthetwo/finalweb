import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { MomoIpnDto } from './dto/momo-ipn.dto';

// Payments accept BOTH logged-in users and guests: a logged-in user may only touch
// their own orders, a guest may only touch guest orders (userId = null). Guest
// orders are addressable solely by their unguessable UUID.
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // ── Initiate MoMo payment → returns qrCodeUrl + payUrl ──
  @Post('initiate')
  @UseGuards(OptionalJwtAuthGuard)
  initiate(
    @CurrentUser('userId') userId: string | undefined,
    @Body() body: InitiatePaymentDto,
  ) {
    return this.payments.initiate(userId ?? null, body.orderId);
  }

  // ── MoMo IPN webhook (called by MoMo server — no auth guard) ──
  @Post('momo/ipn')
  momoIpn(@Body() body: MomoIpnDto) {
    return this.payments.handleMomoIpn(body);
  }

  // ── Frontend polls this every ~3 s while QR is displayed ──
  @Get('status/:orderId')
  @UseGuards(OptionalJwtAuthGuard)
  status(
    @CurrentUser('userId') userId: string | undefined,
    @Param('orderId') orderId: string,
  ) {
    return this.payments.getStatus(userId ?? null, orderId);
  }

  // ── Manual confirm (simulated gateway fallback) ──
  @Post('confirm')
  @UseGuards(OptionalJwtAuthGuard)
  confirm(
    @CurrentUser('userId') userId: string | undefined,
    @Body() body: ConfirmPaymentDto,
  ) {
    return this.payments.confirm(userId ?? null, body.orderId, body.success);
  }
}
