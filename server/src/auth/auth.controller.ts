import { Body, Controller, Get, Post, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(@Body() body: { email: string; password: string; fullName: string }) {
		return this.authService.register(body);
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
		// Pass token via fragment so it never hits the server log
		return res.redirect(`${base}/auth/callback#token=${result.access_token}`);
	}

	@Post('forgot-password')
	forgotPassword(@Body() body: { email: string }) {
		if (!body.email) throw new BadRequestException('Email is required');
		return this.authService.forgotPassword(body.email);
	}

	@Post('reset-password')
	resetPassword(@Body() body: { token: string; password: string }) {
		if (!body.token || !body.password) throw new BadRequestException('Token and password are required');
		if (body.password.length < 6) throw new BadRequestException('Password must be at least 6 characters');
		return this.authService.resetPassword(body.token, body.password);
	}
}
