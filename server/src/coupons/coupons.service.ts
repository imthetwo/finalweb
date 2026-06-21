import { Injectable } from '@nestjs/common';

@Injectable()
export class CouponsService {
  validate(_code: string, _subtotal: number) {
    return { valid: false, discount: 0, message: 'Coupons are not available.' };
  }
}
