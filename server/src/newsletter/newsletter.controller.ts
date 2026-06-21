import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  subscribe(@Body() body: { email: string }) {
    return this.newsletter.subscribe(body.email ?? '');
  }

  @Get('unsubscribe')
  unsubscribe(@Query('token') token: string) {
    return this.newsletter.unsubscribe(token);
  }
}
