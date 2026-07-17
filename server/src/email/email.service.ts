import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';
import { getClientUrl } from '../common/client-url';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporterPromise: Promise<nodemailer.Transporter>;

  // Supports both variable-name sets: SMTP_* (old standard) and MAIL_* (currently used in .env)
  private readonly mailUser = process.env.SMTP_USER || process.env.MAIL_USER;
  private readonly mailPass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD;
  private readonly mailFrom = process.env.MAIL_FROM || `"Pecify" <${this.mailUser}>`;

  constructor() {
    this.transporterPromise = this.createTransporter();
  }

  // Render has no outbound IPv6 — smtp.gmail.com resolves to both an A and
  // an AAAA record, and Node picks the AAAA record first, which dies with
  // ENETUNREACH (same class of issue as the DATABASE_URL/Supabase fix).
  // Resolving to a literal IPv4 address ourselves and connecting to that
  // sidesteps nodemailer's own dual-stack resolution entirely; `servername`
  // keeps TLS SNI/cert checks targeting the real hostname.
  private async createTransporter(): Promise<nodemailer.Transporter> {
    const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT) || 587;
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com';

    let connectHost = host;
    try {
      const { address } = await dns.promises.lookup(host, { family: 4 });
      connectHost = address;
    } catch (err) {
      this.logger.warn(`IPv4 lookup for ${host} failed, connecting by hostname instead: ${(err as Error).message}`);
    }

    return nodemailer.createTransport({
      host: connectHost,
      port,
      secure: port === 465, // true for direct SSL, false for STARTTLS (587)
      requireTLS: port !== 465, // require STARTTLS on port 587
      auth: {
        user: this.mailUser,
        pass: this.mailPass,
      },
      tls: {
        rejectUnauthorized: false, // skip cert check in dev
        servername: host,
      },
    });
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

  async sendOrderConfirmation(to: string, orderId: string, totalAmount: number) {
    const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    await this.send(
      to,
      `Order confirmation #${orderId.slice(0, 8).toUpperCase()}`,
      `<h2>Your order has been placed successfully!</h2>
       <p>Order ID: <strong>${orderId.slice(0, 8).toUpperCase()}</strong></p>
       <p>Total: <strong>${fmt.format(totalAmount)}</strong></p>
       <p>We'll process your order as soon as possible.</p>
       <a href="${getClientUrl()}/account?tab=orders">View order</a>`,
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
       <p>Click the link below to verify your email (valid for 24 hours):</p>
       <a href="${link}">${link}</a>
       <p>You can keep browsing and shopping in the meantime — this is just to confirm we can reach you.</p>`,
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
    if (!this.mailUser) {
      this.logger.warn(`Email skipped (no SMTP/MAIL config): ${subject} → ${to}`);
      return;
    }
    try {
      const transporter = await this.transporterPromise;
      await transporter.sendMail({
        from: this.mailFrom,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent: ${subject} → ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }
}
