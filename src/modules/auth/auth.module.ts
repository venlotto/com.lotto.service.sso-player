import { Logger, Module, DynamicModule, forwardRef } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { PrismaService } from "../prisma/prisma.service";
import { AuthController } from "./controller/auth.controller";
import { PermissionController } from "./controller/permission.controller";
import { RoleController } from "./controller/role.controller";
import { RemovePermissionsController } from "./controller/remove-permissions.controller";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { RefreshTokenRepository } from "./repository/refresh-token.repository";
import { AuthService } from "./services/auth.service";
import { BootstrapService } from "./services/bootstrap.service";
import { PermissionService } from "./services/permission.service";
import { LocalStrategy } from "./strategy/local.strategy";
import { PrismaModule } from "../prisma/prisma.module";
import { RoleService } from "./services/role.service";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { UserRepositoryPrisma } from "../user/repository/user.repository.prisma";
import { UserService } from "../user/services/user.service";
import { UserModule } from "../user/user.module";

export interface AuthModuleConfig {
  isTestEnvironment?: boolean;
}

@Module({})
export class AuthModule {
  static forRoot(config: AuthModuleConfig = {}): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      controllers: [
        AuthController,
        RoleController,
        PermissionController,
        RemovePermissionsController,
      ],
      imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const secret = configService.get<string>("JWT_SECRET");
            if (!secret) {
              throw new Error("JWT_SECRET is not defined in configuration");
            }
            return {
              secret,
              signOptions: {
                expiresIn: configService.get<string>("JWT_EXPIRATION") || "1h",
              },
            };
          },
          inject: [ConfigService],
        }),
        PrismaModule,
        forwardRef(() => UserModule),
      ],
      providers: [
        Logger,
        PrismaService,
        {
          provide: "UserRepository",
          useClass: UserRepositoryPrisma,
        },
        RefreshTokenRepository,
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        PermissionGuard,
        LocalStrategy,
        LocalAuthGuard,
        RoleService,
        PermissionService,
        {
          provide: BootstrapService,
          useFactory: (
            prisma: PrismaService,
            roleService: RoleService,
            permissionService: PermissionService,
            authService: AuthService,
            logger: Logger,
            userService: UserService,
          ) => {
            return new BootstrapService(
              prisma,
              roleService,
              permissionService,
              logger,
              config.isTestEnvironment ?? false,
              userService,
            );
          },
          inject: [
            PrismaService,
            RoleService,
            PermissionService,
            AuthService,
            Logger,
            UserService,
          ],
        },
      ],
      exports: [AuthService, JwtAuthGuard, PermissionGuard, RoleService],
    };
  }
}
