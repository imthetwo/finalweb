import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  // Hỗ trợ cả 2 bộ tên biến: SMTP_* (chuẩn cũ) và MAIL_* (đang dùng trong .env)
  private readonly mailUser = process.env.SMTP_USER || process.env.MAIL_USER;
  private readonly mailPass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD;
  private readonly mailFrom = process.env.MAIL_FROM || `"Pecify Store" <${this.mailUser}>`;

  constructor() {
    const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT) || 587;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465, // true cho SSL trực tiếp, false cho STARTTLS (587)
      requireTLS: port !== 465, // bắt buộc STARTTLS trên port 587
      auth: {
        user: this.mailUser,
        pass: this.mailPass,
      },
      tls: {
        rejectUnauthorized: false, // bỏ check cert trong dev
      },
    });
  }

  async sendWelcome(to: string, fullName: string) {
    await this.send(
      to,
      'Welcome to Pecify!',
      `<h2>Hi ${fullName}!</h2>
       <p>Your account has been created successfully at <strong>Pecify</strong> — where you can explore and build your custom PC.</p>
       <p>Visit us at <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">Pecify Store</a></p>`,
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
       <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/account?tab=orders">View order</a>`,
    );
  }

  async sendPasswordReset(to: string, token: string) {
    const link = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.send(
      to,
      'Reset your Pecify password',
      `<h2>Password reset request</h2>
       <p>Click the link below to reset your password (valid for 1 hour):</p>
       <a href="${link}">${link}</a>
       <p>If you didn't request this, please ignore this email.</p>`,
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
       <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/account?tab=orders">View details</a>`,
    );
  }

  async sendNewsletterWelcome(to: string, unsubscribeToken: string) {
    const base = process.env.CLIENT_URL || 'http://localhost:3000';
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
      await this.transporter.sendMail({
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
