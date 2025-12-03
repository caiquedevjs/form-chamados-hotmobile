import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilita validação global (para seus DTOs funcionarem)
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // 2. Habilita CORS (Permite que o React converse com o Nest)
  app.enableCors(); 

  await app.listen(3000);
}
bootstrap();