import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import * as express from "express";
import helmet from "helmet";

import { AppModule } from "./app/app.module";
import { HttpExceptionFilter } from "./core/filters/http.exception.filters";
import { TransformInterceptor } from "./core/interceptors/transform.interceptor";
import { CorsMiddleware } from "./middleware/cors.middleware";

const logger = new Logger();

dotenv.config();

async function bootstrap(): Promise<void> {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  expressApp.set("trust proxy", 1);

  app.use(cookieParser(process.env.COOKIE_SECRET));

  const corsMiddleware = new CorsMiddleware();
  app.use((req, res, next) => corsMiddleware.use(req, res, next));

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "same-site" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("Auth Service API")
    .setDescription("API documentation for the Auth Service")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  logger.log(
    `🚀 ${process.env.APP_NAME} service started successfully on port ${port}`,
  );
}

bootstrap().catch((error) => {
  logger.debug(error);
  logger.error(error, null, "Bootstrap");
});
