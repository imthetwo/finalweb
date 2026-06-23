import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
		const base = process.env.CLIENT_URL || 'http://localhost:3000';
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
}
