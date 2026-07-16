import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { getClientUrl } from '../common/client-url';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post('login')
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

	@Post('forgot-password')
	forgotPassword(@Body() dto: ForgotPasswordDto) {
		return this.authService.forgotPassword(dto.email);
	}

	@Post('reset-password')
	resetPassword(@Body() dto: ResetPasswordDto) {
		return this.authService.resetPassword(dto.token, dto.password);
	}

	@Post('verify-email')
	verifyEmail(@Body() dto: VerifyEmailDto) {
		return this.authService.verifyEmail(dto.token);
	}

	@Post('resend-verification')
	@UseGuards(JwtAuthGuard)
	resendVerification(@CurrentUser('userId') userId: string) {
		return this.authService.resendVerification(userId);
	}
}
