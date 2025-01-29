import {
  Module,
  Logger,
  MiddlewareConsumer,
  NestModule,
  DynamicModule,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";

import { AppController } from "./app.controller";
import { CoreModule } from "../core/core.module";
import { CorrelationIdMiddleware } from "../middleware/correlation-id.middleware";
import { AuthModule } from "../modules/auth/auth.module";
import { PrismaModule } from "../modules/prisma/prisma.module";
import { UserModule } from "../modules/user/user.module";

@Module({
  imports: [
    CoreModule,
    TerminusModule,
    AuthModule.forRoot(),
    UserModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }

  static register(config: ConfigService): DynamicModule {
    return {
      module: AppModule,
      imports: [
        // Your dynamic imports here
      ],
      providers: [
        {
          provide: ConfigService,
          useValue: config,
        },
      ],
    };
  }
}
