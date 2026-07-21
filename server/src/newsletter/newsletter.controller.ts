import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { ConfirmSubscriptionDto } from './dto/confirm-subscription.dto';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  // POST /newsletter/subscribe
  @Post('subscribe')
  @HttpCode(200)
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletter.subscribe(dto);
  }

  // POST /newsletter/confirm — double opt-in, called from the confirm-email link
  @Post('confirm')
  @HttpCode(200)
  confirm(@Body() dto: ConfirmSubscriptionDto) {
    return this.newsletter.confirm(dto);
  }

  // POST /newsletter/unsubscribe — called from the "Unsubscribe" link in every
  // newsletter email (same token, see EmailService.sendNewsletterWelcome)
  @Post('unsubscribe')
  @HttpCode(200)
  unsubscribe(@Body() dto: ConfirmSubscriptionDto) {
    return this.newsletter.unsubscribe(dto);
  }
}
