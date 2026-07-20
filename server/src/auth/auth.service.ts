import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		private readonly email: EmailService,
	) {}

	async validateUser(email: string, password: string) {
		const user = await this.prisma.user.findUnique({ where: { email } });
		if (!user) return null;
		const match = await bcrypt.compare(password, user.password);
		if (!match) return null;
		return user;
	}

	async register(dto: { email: string; password: string; fullName: string; subscribeNewsletter?: boolean }) {
		const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
		if (existing) {
			throw new ConflictException('Email already registered');
		}
		const password = await bcrypt.hash(dto.password, 10);
		const verifyToken = randomBytes(32).toString('hex');
		const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				password,
				fullName: dto.fullName,
				verifyToken,
				verifyTokenExpiry,
			},
		});

		// Non-blocking: registration succeeds regardless of whether this email
		// actually goes out — verification is a gentle nudge, never a gate.
		this.email.sendEmailVerification(user.email, verifyToken).catch(() => {});

		// Record newsletter intent as a pending (isActive: false) row — the
		// account's own email-verification link is what confirms it (no separate
		// double opt-in needed), see verifyEmail() below.
		if (dto.subscribeNewsletter) {
			this.prisma.newsletterSubscriber
				.upsert({
					where: { email: user.email },
					create: { email: user.email, source: 'register' },
					update: {},
				})
				.catch(() => {});
		}

		const payload = { sub: user.id, email: user.email, fullName: user.fullName, role: user.role, isEmailVerified: user.isEmailVerified };
		const access_token = this.jwtService.sign(payload);
		return {
			access_token,
			user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isEmailVerified: user.isEmailVerified },
		};
	}

	async login(dto: LoginDto) {
		const user = await this.validateUser(dto.email, dto.password);
		if (!user) throw new UnauthorizedException('Invalid credentials');

		const payload = { sub: user.id, email: user.email, fullName: user.fullName, role: user.role, isEmailVerified: user.isEmailVerified };
		const access_token = this.jwtService.sign(payload);

		const safeUser = { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isEmailVerified: user.isEmailVerified };
		return { access_token, user: safeUser };
	}

	async googleLogin(user: { id: string; email: string; firstName?: string; lastName?: string }) {
		if (!user?.email) {
			throw new UnauthorizedException('Google account email is required');
		}

		const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email.split('@')[0];
		const googleId = user.id;
		const existingUser = await this.prisma.user.findUnique({ where: { email: user.email } });

		let account = existingUser;

		if (!account) {
			const dummyPassword = await bcrypt.hash(`google-${randomBytes(24).toString('hex')}`, 10);
			account = await this.prisma.user.create({
				data: {
					email: user.email,
					password: dummyPassword,
					fullName,
					googleId,
					// Google already proved ownership of this email during its own
					// OAuth consent screen — no app-level verification needed on top.
					isEmailVerified: true,
				},
			});
		} else {
			account = await this.prisma.user.update({
				where: { email: user.email },
				data: {
					fullName: account.fullName || fullName,
					googleId: account.googleId || googleId,
					// Signing in with Google to an existing (possibly unverified)
					// password account is itself proof of email ownership.
					isEmailVerified: true,
				},
			});
		}

		const payload = { sub: account.id, email: account.email, fullName: account.fullName, role: account.role, isEmailVerified: account.isEmailVerified };
		const access_token = this.jwtService.sign(payload);
		const safeUser = { id: account.id, email: account.email, fullName: account.fullName, role: account.role, isEmailVerified: account.isEmailVerified };

		return { access_token, user: safeUser };
	}

	async forgotPassword(emailAddr: string) {
		const user = await this.prisma.user.findUnique({ where: { email: emailAddr } });
		// Always return ok=true — don't reveal if email exists
		if (!user) return { ok: true };

		const token = randomBytes(32).toString('hex');
		const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		// Persist token in DB so it survives server restarts
		await this.prisma.user.update({
			where: { email: emailAddr },
			data: { resetToken: token, resetTokenExpiry: expiry },
		});

		await this.email.sendPasswordReset(emailAddr, token);
		return { ok: true };
	}

	async resetPassword(token: string, newPassword: string) {
		const user = await this.prisma.user.findFirst({
			where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
		});
		if (!user) throw new BadRequestException('Invalid or expired reset link');

		const password = await bcrypt.hash(newPassword, 10);
		await this.prisma.user.update({
			where: { id: user.id },
			data: { password, resetToken: null, resetTokenExpiry: null },
		});
		return { ok: true };
	}

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

		const payload = { sub: updated.id, email: updated.email, fullName: updated.fullName, role: updated.role, isEmailVerified: updated.isEmailVerified };
		const access_token = this.jwtService.sign(payload);
		const safeUser = { id: updated.id, email: updated.email, fullName: updated.fullName, role: updated.role, isEmailVerified: updated.isEmailVerified };
		return { access_token, user: safeUser };
	}

	async resendVerification(userId: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new NotFoundException('User not found');
		if (user.isEmailVerified) return { ok: true, alreadyVerified: true };

		const verifyToken = randomBytes(32).toString('hex');
		const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
		await this.prisma.user.update({
			where: { id: userId },
			data: { verifyToken, verifyTokenExpiry },
		});
		await this.email.sendEmailVerification(user.email, verifyToken);
		return { ok: true, alreadyVerified: false };
	}
}
