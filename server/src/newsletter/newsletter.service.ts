import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { ConfirmSubscriptionDto } from './dto/confirm-subscription.dto';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  // Double opt-in: a row is only isActive once the confirm-email link is
  // clicked — @IsEmail() only checks format, not that the address actually
  // exists or is reachable, and a fake/mistyped address would otherwise sit
  // "subscribed" forever with no way to tell it apart from a real one.
  async subscribe(dto: SubscribeDto) {
    const normalised = dto.email.trim().toLowerCase();

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: normalised },
    });

    if (existing) {
      if (existing.isActive) return { ok: true, alreadySubscribed: true };

      // Never confirmed (or unsubscribed) — resend the confirm link rather
      // than reactivating outright.
      if (dto.source && dto.source !== existing.source) {
        await this.prisma.newsletterSubscriber.update({
          where: { email: normalised },
          data: { source: dto.source },
        });
      }
      await this.email.sendNewsletterConfirm(normalised, existing.unsubscribeToken);
      return { ok: true };
    }

    const subscriber = await this.prisma.newsletterSubscriber.create({
      data: { email: normalised, source: dto.source },
    });

    await this.email.sendNewsletterConfirm(normalised, subscriber.unsubscribeToken);
    return { ok: true };
  }

  async confirm(dto: ConfirmSubscriptionDto) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: dto.token },
    });
    if (!subscriber) throw new NotFoundException('Invalid or expired confirmation link');
    if (subscriber.isActive) return { ok: true, alreadyConfirmed: true };

    await this.prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { isActive: true },
    });
    await this.email.sendNewsletterWelcome(subscriber.email, subscriber.unsubscribeToken);
    return { ok: true };
  }

  // Same token doubles as the unsubscribe link (see sendNewsletterWelcome) —
  // self-service, no login required, matched by the unguessable token so
  // nobody can unsubscribe someone else using just their email.
  async unsubscribe(dto: ConfirmSubscriptionDto) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: dto.token },
    });
    if (!subscriber) throw new NotFoundException('Invalid unsubscribe link');
    if (!subscriber.isActive) return { ok: true, alreadyUnsubscribed: true };

    await this.prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { isActive: false },
    });
    return { ok: true };
  }
}
