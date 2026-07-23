import {
  Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CancelOrderDto, UpdateOrderStatusDto } from './dto/admin-product.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class ListAdminOrdersQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminOrdersController {
  constructor(private readonly admin: AdminService) {}

  // ── Orders: STAFF views + updates shipping progress, ADMIN has full control ───

  @Get('orders')
  @Roles(Role.ADMIN, Role.STAFF)
  listOrders(@Query() query: ListAdminOrdersQueryDto) {
    return this.admin.listOrders(query);
  }

  // STAFF + ADMIN — routine shipping progress (PENDING/PROCESSING/SHIPPED).
  // DELIVERED is ADMIN-only (see updateOrderStatus) — for COD, that's the
  // moment cash actually changes hands, so only an admin confirms it.
  // CANCELLED is rejected here — see cancelOrder below.
  @Patch('orders/:id/status')
  @Roles(Role.ADMIN, Role.STAFF)
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('role') role: Role,
  ) {
    return this.admin.updateOrderStatus(id, dto.status, role);
  }

  // STAFF + ADMIN — accepts an order awaiting confirmation into the normal
  // fulfillment pipeline (purely operational, like routine status progress).
  @Patch('orders/:id/accept')
  @Roles(Role.ADMIN, Role.STAFF)
  acceptOrder(
    @Param('id') id: string,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.admin.acceptOrder(id, actorId);
  }

  // ADMIN ONLY — rejects an order awaiting confirmation (e.g. real stock
  // doesn't match); refunds through MoMo first if it was actually paid.
  @Post('orders/:id/reject')
  @Roles(Role.ADMIN)
  rejectOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.admin.rejectOrder(id, dto.reason, actorId);
  }

  // ADMIN ONLY — cancel + restock, requires a reason (financial action)
  @Post('orders/:id/cancel')
  @Roles(Role.ADMIN)
  cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.admin.cancelOrder(id, dto.reason, actorId);
  }

  // ADMIN ONLY — force-recheck payment status directly against MoMo's query
  // API, for when the IPN webhook is delayed or lost (fixes the "customer
  // paid but order still shows Unpaid" desync without any auto-cancellation).
  @Post('orders/:id/recheck-payment')
  @Roles(Role.ADMIN)
  recheckPayment(@Param('id') id: string) {
    return this.admin.forcePollPayment(id);
  }

  // ADMIN ONLY — real MoMo refund for a paid order; only cancels + restocks
  // on a confirmed MoMo success (see PaymentsService.refundPayment)
  @Post('orders/:id/refund')
  @Roles(Role.ADMIN)
  refundOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.admin.refundOrder(id, dto.reason, actorId);
  }

  @Get('orders/export')
  @Roles(Role.ADMIN)
  async exportOrders(@Res() res: Response) {
    const buffer = await this.admin.exportOrdersExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="orders-report-${Date.now()}.xlsx"`);
    res.send(buffer);
  }
}
