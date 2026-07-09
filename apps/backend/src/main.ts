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

function parseCorsOrigins(
  raw: string | undefined,
  nodeEnv: string,
): boolean | string[] {
  if (raw && raw.trim().length > 0) {
    return raw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
  // ไม่กำหนด CORS_ORIGINS ใน production → ปิด cross-origin
  if (nodeEnv === 'production') {
    return false;
  }
  return true;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');
  const port = configService.getOrThrow<number>('PORT');
  const bodyLimit = configService.get<string>('BODY_LIMIT') ?? '1mb';
  const uploadBodyLimit =
    configService.get<string>('UPLOAD_BODY_LIMIT') ?? '50mb';
  const corsOrigins = configService.get<string>('CORS_ORIGINS');

  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ limit: bodyLimit, extended: true }));
  // upload routes ต้องรับ payload ใหญ่กว่า default
  app.use('/api/uploadFile', json({ limit: uploadBodyLimit }));
  app.use(
    '/api/uploadFile',
    urlencoded({ limit: uploadBodyLimit, extended: true }),
  );
  app.use('/api/images/upload', json({ limit: uploadBodyLimit }));
  app.use(
    '/api/images/upload',
    urlencoded({ limit: uploadBodyLimit, extended: true }),
  );

  app.enableCors({
    origin: parseCorsOrigins(corsOrigins, nodeEnv),
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
