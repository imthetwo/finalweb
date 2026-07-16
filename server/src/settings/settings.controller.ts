import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IsString } from 'class-validator';

class UpdateSettingDto {
  @IsString()
  value!: string;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // Public — read by HeroSection
  @Get(':key')
  get(@Param('key') key: string) {
    return this.settings.get(key).then((value) => ({ key, value }));
  }

  // Admin only
  @Patch(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  set(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settings.set(key, dto.value);
  }
}
