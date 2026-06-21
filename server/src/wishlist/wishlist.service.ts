import { Injectable } from '@nestjs/common';

@Injectable()
export class WishlistService {
  list(_userId: string) {
    return [];
  }

  add(_userId: string, _productId: string) {
    return { ok: true };
  }

  remove(_userId: string, _productId: string) {
    return { ok: true };
  }
}
