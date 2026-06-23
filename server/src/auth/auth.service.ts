import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
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

	async register(dto: { email: string; password: string; fullName: string }) {
		const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
		if (existing) {
			throw new UnauthorizedException('Email already registered');
		}
		const password = await bcrypt.hash(dto.password, 10);
		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				password,
				fullName: dto.fullName,
			},
		});
		const payload = { sub: user.id, email: user.email, fullName: user.fullName, role: user.role };
		const access_token = this.jwtService.sign(payload);
		return {
			access_token,
			user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
		};
	}

	async login(dto: LoginDto) {
		const user = await this.validateUser(dto.email, dto.password);
		if (!user) throw new UnauthorizedException('Invalid credentials');

		const payload = { sub: user.id, email: user.email, fullName: user.fullName, role: user.role };
		const access_token = this.jwtService.sign(payload);

		const safeUser = { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
		return { access_token, user: safeUser };
	}

	async googleLogin(user: { email: string; firstName?: string; lastName?: string; picture?: string }) {
		if (!user?.email) {
			throw new UnauthorizedException('Google account email is required');
		}

		const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email.split('@')[0];
		const avatarUrl = user.picture || null;
		const existingUser = await this.prisma.user.findUnique({ where: { email: user.email } });

		let account = existingUser;

		if (!account) {
			const dummyPassword = await bcrypt.hash(`google-${randomBytes(24).toString('hex')}`, 10);
			account = await this.prisma.user.create({
				data: {
					email: user.email,
					password: dummyPassword,
					fullName,
					avatarUrl,
				},
			});
		} else {
			account = await this.prisma.user.update({
				where: { email: user.email },
				data: {
					fullName: account.fullName || fullName,
					avatarUrl: account.avatarUrl || avatarUrl,
				},
			});
		}

		const payload = { sub: account.id, email: account.email, fullName: account.fullName, role: account.role };
		const access_token = this.jwtService.sign(payload);
		const safeUser = { id: account.id, email: account.email, fullName: account.fullName, role: account.role, avatarUrl: account.avatarUrl };

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
}
