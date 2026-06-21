import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomLabModule } from './custom-lab/custom-lab.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { MediaModule } from './media/media.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { EmailModule } from './email/email.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { AiModule } from './ai/ai.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CouponsModule } from './coupons/coupons.module';
import { AdminModule } from './admin/admin.module';
import { QrModule } from './qr/qr.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PromotionsModule } from './promotions/promotions.module';

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
    CustomLabModule,
    OrdersModule,
    PaymentsModule,
    NewsletterModule,
    AiModule,
    WishlistModule,
    ReviewsModule,
    CouponsModule,
    AdminModule,
    QrModule,
    PromotionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
