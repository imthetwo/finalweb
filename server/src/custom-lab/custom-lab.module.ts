import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomLabController } from './custom-lab.controller';
import { CustomLabService } from './custom-lab.service';
import { CompatibilityService } from './compatibility.service';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, ProductsModule, AuthModule],
  controllers: [CustomLabController],
  providers: [CustomLabService, CompatibilityService],
  exports: [CustomLabService],
})
export class CustomLabModule {}
