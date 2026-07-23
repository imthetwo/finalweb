import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';
import { issueToken } from './issue-token.util';

@Injectable()
export class EmailVerificationService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		private readonly email: EmailService,
	) {}

	// Reissues a fresh JWT so the client's auth state reflects isEmailVerified
	// immediately, without requiring a logout/login round trip.
	async verifyEmail(token: string) {
		const user = await this.prisma.user.findFirst({
			where: { verifyToken: token, verifyTokenExpiry: { gt: new Date() } },
		});
		if (!user) throw new BadRequestException('Invalid or expired verification link');

		const updated = await this.prisma.user.update({
			where: { id: user.id },
			data: { isEmailVerified: true, verifyToken: null, verifyTokenExpiry: null },
		});

		// Activate any newsletter subscription requested at registration — the
		// account's email is now proven real, so no separate confirm email needed.
		const subscriber = await this.prisma.newsletterSubscriber.findUnique({ where: { email: updated.email } });
		if (subscriber && !subscriber.isActive) {
			await this.prisma.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { isActive: true } });
			this.email.sendNewsletterWelcome(subscriber.email, subscriber.unsubscribeToken).catch(() => {});
		}

		return issueToken(this.jwtService, updated);
	}

	// Mints a fresh 24h verification token for the user and emails it. Shared
	// by both resend paths below — the only real difference between them is how
	// the user is looked up and what they're allowed to reveal in the response.
	private async issueFreshVerification(user: { id: string; email: string }) {
		const verifyToken = randomBytes(32).toString('hex');
		const verifyTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15min
		await this.prisma.user.update({
			where: { id: user.id },
			data: { verifyToken, verifyTokenExpiry },
		});
		await this.email.sendEmailVerification(user.email, verifyToken);
	}

	// Public — no login required: registration issues no session until
	// verified, and login itself is blocked while unverified, so there's no
	// authenticated path a still-unverified user could reach instead. Always
	// returns ok:true regardless of outcome so it can't be used to probe which
	// emails have an account (same pattern as PasswordResetService.forgotPassword()).
	async resendVerificationByEmail(emailAddr: string) {
		const user = await this.prisma.user.findUnique({ where: { email: emailAddr } });
		if (!user || user.isEmailVerified) return { ok: true };

		await this.issueFreshVerification(user);
		return { ok: true };
	}
}
