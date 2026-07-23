import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers(params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 50, 200);
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, email: true, fullName: true,
        role: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    });
  }

  async updateUserRole(userId: string, role: Role, requesterId: string) {
    if (userId === requesterId) throw new BadRequestException('Cannot change your own role');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Demoting the only remaining admin would lock the whole org out of
    // admin-only actions — including this very endpoint — with no way back
    // short of a direct DB edit. "Cannot change your own role" above already
    // stops a lone admin from doing it to themselves; this covers the
    // otherwise-still-possible case of one admin demoting every other admin
    // (sequentially, or several admins coordinating) down to zero.
    if (user.role === Role.ADMIN && role !== Role.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) throw new BadRequestException('Cannot demote the last remaining admin');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }
}
