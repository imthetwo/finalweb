import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { EmailModule } from '../email/email.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminProductsService } from './services/admin-products.service';
import { AdminOrdersService } from './services/admin-orders.service';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule, EmailModule, CloudinaryModule],
  controllers: [AdminController],
  providers: [AdminService, AdminStatsService, AdminProductsService, AdminOrdersService],
})
export class AdminModule {}
