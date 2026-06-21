import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewsService {
  findByProduct(_productId: string) {
    return { reviews: [], average: 0, count: 0 };
  }

  create(_userId: string, _dto: unknown) {
    return null;
  }
}
