import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
