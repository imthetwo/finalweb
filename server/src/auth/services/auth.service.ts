import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { randomBytes } from 'crypto';
import { issueToken } from '../utils/issue-token.util';

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
		const verifyTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15min
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
		// double opt-in needed), see EmailVerificationService.verifyEmail().
		if (dto.subscribeNewsletter) {
			this.prisma.newsletterSubscriber
				.upsert({
					where: { email: user.email },
					create: { email: user.email, source: 'register' },
					update: {},
				})
				.catch(() => {});
		}

		// Verification is mandatory — no session is issued at registration.
		// The account only becomes usable once the emailed link is clicked
		// (see EmailVerificationService.verifyEmail(), which is what actually
		// signs the first JWT).
		return { ok: true, email: user.email };
	}

	async login(dto: LoginDto) {
		const user = await this.validateUser(dto.email, dto.password);
		if (!user) throw new UnauthorizedException('Invalid email or password');
		if (!user.isEmailVerified) {
			throw new UnauthorizedException('Please verify your email before signing in — check your inbox for the verification link.');
		}
		return issueToken(this.jwtService, user);
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

		return issueToken(this.jwtService, account);
	}
}
