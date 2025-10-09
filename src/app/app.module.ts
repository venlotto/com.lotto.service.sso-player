import {
  Module,
  Logger,
  MiddlewareConsumer,
  NestModule,
  DynamicModule,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { TerminusModule } from "@nestjs/terminus";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 60 seconds in milliseconds
          limit: 10,
        },
      ],
    }),
    AuthModule.forRoot(),
    UserModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    Logger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
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
