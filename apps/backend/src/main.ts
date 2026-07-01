import {
  ValidationPipe,
  VersioningType,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  const configService = app.get(ConfigService);
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');
  const port = configService.getOrThrow<number>('PORT');

  app.enableCors({
    exposedHeaders: ['Date'],
  });
  app.setGlobalPrefix('api');
  // เปิด URI versioning แบบ opt-in: route เดิมไม่มี @Version จะเป็น VERSION_NEUTRAL (path เดิม /api/... ไม่เปลี่ยน)
  // เมื่อจะออก breaking API ใหม่ ให้ใส่ @Version('1') ที่ controller/handler → path เป็น /api/v1/...
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  if (nodeEnv === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BUU GET API')
      .setDescription('Backend API documentation for BUU GET')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);
}

void bootstrap();
