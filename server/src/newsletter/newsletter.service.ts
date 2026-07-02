import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async subscribe(dto: SubscribeDto) {
    const normalised = dto.email.trim().toLowerCase();

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: normalised },
    });

    if (existing) {
      if (!existing.isActive) {
        await this.prisma.newsletterSubscriber.update({
          where: { email: normalised },
          data: { isActive: true, source: dto.source ?? existing.source },
        });
        await this.email.sendNewsletterWelcome(normalised, existing.unsubscribeToken);
        return { ok: true };
      }
      return { ok: true, alreadySubscribed: true };
    }

    const subscriber = await this.prisma.newsletterSubscriber.create({
      data: { email: normalised, source: dto.source },
    });

    await this.email.sendNewsletterWelcome(normalised, subscriber.unsubscribeToken);
    return { ok: true };
  }
}
