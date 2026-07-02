import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { MediaModule } from './media/media.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { EmailModule } from './email/email.module';
import { AiModule } from './ai/ai.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CouponsModule } from './coupons/coupons.module';
import { AdminModule } from './admin/admin.module';
import { QrModule } from './qr/qr.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PromotionsModule } from './promotions/promotions.module';
import { SettingsModule } from './settings/settings.module';
import { NewsletterModule } from './newsletter/newsletter.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    MediaModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    AiModule,
    WishlistModule,
    CouponsModule,
    AdminModule,
    QrModule,
    PromotionsModule,
    SettingsModule,
    NewsletterModule,
  ],
})
export class AppModule {}
