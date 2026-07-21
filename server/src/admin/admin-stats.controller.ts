import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminStatsController {
  constructor(private readonly admin: AdminService) {}

  // STAFF read-only, ADMIN full access
  @Get('stats')
  @Roles(Role.ADMIN, Role.STAFF)
  stats() {
    return this.admin.stats();
  }
}
