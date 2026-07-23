import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { EmailModule } from '../email/email.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PaymentsModule } from '../payments/payments.module';
import { AdminStatsController } from './admin-stats.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminService } from './admin.service';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminProductsCrudService } from './services/admin-products-crud.service';
import { AdminProductsExportService } from './services/admin-products-export.service';
import { AdminOrdersService } from './services/admin-orders.service';
import { AdminOrdersExportService } from './services/admin-orders-export.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule, EmailModule, CloudinaryModule, PaymentsModule],
  controllers: [AdminStatsController, AdminProductsController, AdminOrdersController, AdminUsersController],
  providers: [
    AdminService, AdminStatsService,
    AdminProductsCrudService, AdminProductsExportService,
    AdminOrdersService, AdminOrdersExportService, AdminUsersService,
  ],
})
export class AdminModule {}
