import { Controller, Get } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  /** Public — active promo banners for the header PromoBar. */
  @Get()
  listActive() {
    return this.promotions.listActive();
  }
}
