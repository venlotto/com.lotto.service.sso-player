import { Logger, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AssignRoleController } from "./controller/assign-role.controller";
import { ChangePasswordController } from "./controller/change-password.controller";
import { ChangeStatusController } from "./controller/change-status.controller";
import { ListUsersController } from "./controller/list-users.controller";
import { MeController } from "./controller/me.controller";
import { NewUserController } from "./controller/new-user.controller";
import { RemoveRolesController } from "./controller/remove-roles.controller";
import { UserRepositoryPrisma } from "./repository/user.repository.prisma";
import { UserService } from "./services/user.service";

// NOTE: AuthModule.forRoot() is registered as global in AppModule, so its
// exports (RoleService, JwtAuthGuard, PermissionGuard) resolve here without
// an explicit import. Importing AuthModule would re-create the auth<->user
// module cycle.
@Module({
  imports: [PrismaModule],
  controllers: [
    NewUserController,
    ChangePasswordController,
    ChangeStatusController,
    AssignRoleController,
    MeController,
    ListUsersController,
    RemoveRolesController,
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
