import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class PasswordResetService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailService,
	) {}

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
