import { Controller, Get, Param } from '@nestjs/common';
import { QrService } from './qr.service';

@Controller('qr')
export class QrController {
  constructor(private readonly qr: QrService) {}

  @Get('order/:id')
  order(@Param('id') id: string) {
    return this.qr.orderQr(id);
  }

  @Get('product/:id')
  product(@Param('id') id: string) {
    return this.qr.productQr(id);
  }
}
