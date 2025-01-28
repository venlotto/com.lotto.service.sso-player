import { Logger, Module, forwardRef } from "@nestjs/common";

import { ChangePasswordController } from "./controller/change-password.controller";
import { ChangeStatusController } from "./controller/change-status.controller";
import { NewUserController } from "./controller/new-user.controller";
import { UserRepositoryPrisma } from "./repository/user.repository.prisma";
import { UserService } from "./services/user.service";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [
    forwardRef(() => AuthModule.forRoot()),
    PrismaModule,
  ],
  controllers: [
    NewUserController,
    ChangePasswordController,
    ChangeStatusController,
  ],
  providers: [
    UserService,
    Logger,
    {
      provide: "UserRepository",
      useClass: UserRepositoryPrisma,
    },
  ],
  exports: [UserService, "UserRepository"],
})
export class UserModule {}
