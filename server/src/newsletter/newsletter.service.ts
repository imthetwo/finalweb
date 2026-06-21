import { Injectable } from '@nestjs/common';

@Injectable()
export class NewsletterService {
  subscribe(_email: string) {
    return { ok: false, message: 'Newsletter is not available.' };
  }

  unsubscribe(_token: string) {
    return { ok: false };
  }
}
