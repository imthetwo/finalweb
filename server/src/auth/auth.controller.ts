import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationByEmailDto } from './dto/resend-verification-by-email.dto';
import { getClientUrl } from '../common/client-url';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly passwordReset: PasswordResetService,
		private readonly emailVerification: EmailVerificationService,
	) {}

	@Post('register')
	async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	// Stricter than the app-wide default — unlimited attempts would let
	// credential-stuffing/brute-force run freely against any known email.
	@Post('login')
	@Throttle({ default: { limit: 5, ttl: 60_000 } })
	async login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@Get('google')
	@UseGuards(AuthGuard('google'))
	async googleLogin() {
		return;
	}

	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	async googleLoginCallback(@Req() req: Request, @Res() res: Response) {
		const result = await this.authService.googleLogin(req.user as any);
		const base = getClientUrl();
		return res.redirect(`${base}/auth/callback#token=${result.access_token}`);
	}

	// Stricter than the app-wide default — this always returns ok:true (no
	// account enumeration), but is otherwise free to spam-bomb any inbox via
	// the app's own transactional sender without a limit.
	@Post('forgot-password')
	@Throttle({ default: { limit: 5, ttl: 60_000 } })
	forgotPassword(@Body() dto: ForgotPasswordDto) {
		return this.passwordReset.forgotPassword(dto.email);
	}

	@Post('reset-password')
	resetPassword(@Body() dto: ResetPasswordDto) {
		return this.passwordReset.resetPassword(dto.token, dto.password);
	}

	@Post('verify-email')
	verifyEmail(@Body() dto: VerifyEmailDto) {
		return this.emailVerification.verifyEmail(dto.token);
	}

	// Public — for a just-registered or login-blocked (unverified) user, who
	// by definition can't hold a valid JWT to use the endpoint above. Same
	// email-bomb concern as forgot-password, so same stricter limit.
	@Post('resend-verification-by-email')
	@Throttle({ default: { limit: 5, ttl: 60_000 } })
	resendVerificationByEmail(@Body() dto: ResendVerificationByEmailDto) {
		return this.emailVerification.resendVerificationByEmail(dto.email);
	}
}
