import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { AUTH_COOKIE_NAME } from './app/auth/auth.const';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('UppyBot')
    .setDescription('Апи для взаимодействия с ботом Uppy')
    .setVersion('1.0')
    .addCookieAuth(AUTH_COOKIE_NAME)
    .addBearerAuth({ in: 'header', name: 'Authorization', type: 'apiKey' })
    .build();

  app.setGlobalPrefix('/api');
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 8088);
}
bootstrap();
