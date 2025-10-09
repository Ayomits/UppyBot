import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpStatus, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('UppyBot')
    .setDescription('Апи для взаимодействия с ботом Uppy')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Api key auth',
    })
    .build();

  app.setGlobalPrefix('/api');

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
