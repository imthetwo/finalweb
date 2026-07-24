import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { getClientUrl } from '../common/client-url';
import { formatVnd } from '../common/pricing';

// Sends via the Gmail API (OAuth2) instead of raw SMTP — Render has no
// outbound path to smtp.gmail.com that Google doesn't throttle/drop
// (IPv6-only routing, then plain connection timeouts on both 587 and 465,
// consistent with Google blocking SMTP AUTH from cloud-hosting IP ranges).
// The Gmail API sends over regular HTTPS, which isn't subject to that.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly mailUser = process.env.MAIL_USER || process.env.SMTP_USER;
  private readonly mailFrom = process.env.MAIL_FROM || `"Pecify" <${this.mailUser}>`;
  private readonly oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  constructor() {
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    }
  }

  async sendWelcome(to: string, fullName: string) {
    await this.send(
      to,
      'Welcome to Pecify!',
      `<h2>Hi ${fullName}!</h2>
       <p>Your account has been created successfully at <strong>Pecify</strong> — where you can explore and build your custom PC.</p>
       <p>Visit us at <a href="${getClientUrl()}">Pecify Store</a></p>`,
    );
  }

  // phone is only meaningful for a guest order — that's what /track-order
  // needs alongside the order ID, since a guest has no account to log into
  // and view "My Orders" the way a signed-in customer's link below does.
  async sendOrderConfirmation(to: string, orderId: string, totalAmount: number, guestPhone?: string) {
    const shortId = orderId.slice(0, 8).toUpperCase();
    const viewOrderLink = guestPhone
      ? `${getClientUrl()}/track-order/${orderId}`
      : `${getClientUrl()}/account?tab=orders`;
    await this.send(
      to,
      `Order confirmation #${shortId}`,
      `<h2>Your order has been placed successfully!</h2>
       <p>Order ID: <strong>${shortId}</strong></p>
       <p>Total: <strong>${formatVnd(totalAmount)}</strong></p>
       ${guestPhone ? `<p>Phone number used at checkout: <strong>${guestPhone}</strong></p>
       <p>You'll need both the order ID and this phone number to look up your order later.</p>` : ''}
       <p>We'll process your order as soon as possible.</p>
       <a href="${viewOrderLink}">View order</a>`,
    );
  }

  async sendPasswordReset(to: string, token: string) {
    const link = `${getClientUrl()}/reset-password?token=${token}`;
    await this.send(
      to,
      'Reset your Pecify password',
      `<h2>Password reset request</h2>
       <p>Click the link below to reset your password (valid for 1 hour):</p>
       <a href="${link}">${link}</a>
       <p>If you didn't request this, please ignore this email.</p>`,
    );
  }

  async sendEmailVerification(to: string, token: string) {
    const link = `${getClientUrl()}/verify-email?token=${token}`;
    await this.send(
      to,
      'Verify your Pecify email',
      `<h2>Confirm your email address</h2>
       <p>Click the link below to verify your email (valid for 15 minutes):</p>
       <a href="${link}">${link}</a>
       <p>You can keep browsing and shopping in the meantime — this is just to confirm we can reach you.</p>`,
    );
  }

  async sendGuestOrderConfirmation(to: string, token: string) {
    const link = `${getClientUrl()}/guest-checkout/confirm?token=${token}`;
    await this.send(
      to,
      'Confirm your Pecify order',
      `<h2>One more step to place your order</h2>
       <p>Click the link below to confirm this email address and complete your order (valid for 30 minutes):</p>
       <a href="${link}">${link}</a>
       <p>If you didn't request this, you can safely ignore this email — no order will be placed.</p>`,
    );
  }

  async sendOrderStatusUpdate(to: string, orderId: string, status: string) {
    const statusMap: Record<string, string> = {
      AWAITING_CONFIRMATION: 'Confirming your order',
      PROCESSING: 'Preparing',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
    };
    await this.send(
      to,
      `Order update #${orderId.slice(0, 8).toUpperCase()}`,
      `<h2>Your order has been updated</h2>
       <p>New status: <strong>${statusMap[status] || status}</strong></p>
       <a href="${getClientUrl()}/account?tab=orders">View details</a>`,
    );
  }

  async sendNewsletterConfirm(to: string, confirmToken: string) {
    const link = `${getClientUrl()}/newsletter/confirm?token=${confirmToken}`;
    await this.send(
      to,
      'Confirm your Pecify newsletter subscription',
      `<h2>One more step</h2>
       <p>Click the link below to confirm you'd like to receive the Pecify newsletter:</p>
       <a href="${link}">${link}</a>
       <p>If you didn't request this, you can safely ignore this email — you won't be subscribed.</p>`,
    );
  }

  async sendNewsletterWelcome(to: string, unsubscribeToken: string) {
    const base = getClientUrl();
    const unsubscribeLink = `${base}/newsletter/unsubscribe?token=${unsubscribeToken}`;
    await this.send(
      to,
      'Welcome to the Pecify newsletter! 🎮',
      `<h2>Thanks for subscribing!</h2>
       <p>You'll be the first to hear about <strong>new products, flash sales and PC build guides</strong> from Pecify.</p>
       <p><a href="${base}">Explore Pecify Store now →</a></p>
       <hr/>
       <p style="font-size:12px;color:#888">Don't want these emails? <a href="${unsubscribeLink}">Unsubscribe</a></p>`,
    );
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.mailUser || !process.env.GOOGLE_REFRESH_TOKEN) {
      this.logger.warn(`Email skipped (Gmail API not configured): ${subject} → ${to}`);
      return;
    }
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: buildRawMessage(this.mailFrom, to, subject, html) },
      });
      this.logger.log(`Email sent: ${subject} → ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }
}

// Gmail API takes a full RFC 2822 message, base64url-encoded. Subject is
// RFC 2047-encoded so non-ASCII (e.g. the newsletter emoji) survives.
function buildRawMessage(from: string, to: string, subject: string, html: string): string {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');

  return Buffer.from(message, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
