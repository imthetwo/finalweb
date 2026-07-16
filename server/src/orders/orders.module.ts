import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CartModule } from '../cart/cart.module';
import { AuthModule } from '../auth/auth.module';
import { AddressesModule } from '../addresses/addresses.module';

@Module({
  imports: [PrismaModule, CartModule, AuthModule, AddressesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
