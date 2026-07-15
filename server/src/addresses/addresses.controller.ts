import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string } };

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.addresses.list(req.user.userId);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateAddressDto) {
    return this.addresses.create(req.user.userId, dto);
  }

  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addresses.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.addresses.remove(req.user.userId, id);
  }
}
