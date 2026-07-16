import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not set');
}
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CLIENT_URL may be a comma-separated list (e.g. custom domain + the
  // Vercel-assigned default URL) — avoids re-deploying every time a new
  // preview/alias URL needs access.
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger UI
  const doc = new DocumentBuilder()
    .setTitle('Pecify API')
    .setDescription('Backend API cho Pecify PC Store')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, doc));

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api-docs`);
}

void bootstrap();
