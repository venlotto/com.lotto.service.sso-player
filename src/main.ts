import * as express from 'express';
import helmet from 'helmet';
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app/app.module";
import {ExpressAdapter} from "@nestjs/platform-express";
import {ConfigService} from "@nestjs/config";
import {Logger, ValidationPipe, VersioningType} from "@nestjs/common";
import { setupSwagger } from './swagger';
import * as dotenv from 'dotenv';
import { CorsMiddleware } from './middleware/cors.middleware';

const logger = new Logger();

dotenv.config();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(express()),
  );
  
  app.use(new CorsMiddleware().use);
  const configService = app.get<ConfigService>(ConfigService);
  const port: number = configService.get<number>('app.http.port');
  const host: string = configService.get<string>('app.http.host');
  const version: string = configService.get<string>('api.version');
  const versioningPrefix: string = configService.get<string>('api.version.prefix');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: version,
    prefix: versioningPrefix,
  });

  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe());
  setupSwagger(app);

  await app.listen(port, host);
  logger.log(
      `🚀 ${configService.get(
          'app.name',
      )} service started successfully on port ${port}`,
  );
}

bootstrap().catch(error => {
  logger.debug(error);
  logger.error(error, null, 'Bootstrap');
});
