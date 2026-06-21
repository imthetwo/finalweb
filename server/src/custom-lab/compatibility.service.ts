import { Injectable } from '@nestjs/common';

export type ValidateItem = { slot: string; productId: string };

@Injectable()
export class CompatibilityService {
  validate(_items: ValidateItem[]) {
    return {
      valid: true,
      errors: [],
      warnings: [],
      totalTdp: 0,
      requiredWatts: 0,
      totalPrice: 0,
    };
  }
}
