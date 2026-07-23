import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
