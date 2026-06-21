import { Body, Controller, Post } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Post('validate')
  validate(@Body() body: { code: string; subtotal: number }) {
    return this.coupons.validate(body.code ?? '', body.subtotal ?? 0);
  }
}
