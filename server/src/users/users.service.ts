import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, createdAt: true,
        googleId: true, isEmailVerified: true,
        _count: { select: { orders: true, wishlists: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { googleId, ...rest } = user;
    return { ...rest, isGoogleUser: !!googleId };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
      },
    });
    // Return the full profile (isGoogleUser + _count) so the response matches
    // GET /users/me — callers replace their whole user state with this.
    return this.getProfile(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) throw new BadRequestException('Current password is incorrect');

    const password = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password } });
    return { ok: true, message: 'Password changed successfully' };
  }
}
