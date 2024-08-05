import { NestFactory } from '@nestjs/core';
import { SeederService } from './seeder.service';
import { SeederModule } from './seeder.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  const seederService = app.get(SeederService);
  await seederService.seed();

  await app.close();
}

bootstrap();
