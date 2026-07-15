import { Body, Controller, Post } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Post('validate')
  validate(@Body() body: ValidateCouponDto) {
    return this.coupons.validate(body.code, body.subtotal);
  }
}
