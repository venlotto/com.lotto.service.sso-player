import { Logger, Module, DynamicModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";
import { UserRepositoryPrisma } from "../user/repository/user.repository.prisma";
import { UserService } from "../user/services/user.service";
import { UserModule } from "../user/user.module";
import { AssignPermissionsController } from "./controller/assign-permissions.controller";
import { AuthController } from "./controller/auth.controller";
import { DeletePermissionsController } from "./controller/delete-permissions.controller";
import { DeleteRoleController } from "./controller/delete-role.controller";
import { PermissionController } from "./controller/permission.controller";
import { RemovePermissionsController } from "./controller/remove-permissions.controller";
import { RoleController } from "./controller/role.controller";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { SessionCookieGuard } from "./guards/session-cookie.guard";
import { RefreshTokenRepository } from "./repository/refresh-token.repository";
import { AuthService } from "./services/auth.service";
import { BootstrapService } from "./services/bootstrap.service";
import { PermissionService } from "./services/permission.service";
import { RoleService } from "./services/role.service";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { LocalStrategy } from "./strategy/local.strategy";

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
        AssignPermissionsController,
        DeleteRoleController,
        DeletePermissionsController,
      ],
      imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            const secret = configService.get<string>("JWT_SECRET");
            if (secret === undefined || secret === "") {
              throw new Error("JWT_SECRET is not defined in configuration");
            }
            // jwt.strategy.ts already *validates* issuer and audience from
            // these same variables, and every downstream service (streaker
            // club, blackjack, bingo crush) enforces them. Signing without
            // them made every token fail that validation.
            const issuer = configService.get<string>("JWT_ISSUER");
            const audience = configService.get<string>("JWT_AUDIENCE");
            return {
              secret,
              signOptions: {
                expiresIn: configService.get<string>("JWT_EXPIRATION") ?? "5m",
                ...(issuer !== undefined && issuer !== "" ? { issuer } : {}),
                ...(audience !== undefined && audience !== ""
                  ? { audience }
                  : {}),
              },
            };
          },
          inject: [ConfigService],
        }),
        PrismaModule,
        UserModule,
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
        SessionCookieGuard,
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
          ): BootstrapService => {
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
      exports: [
        AuthService,
        JwtAuthGuard,
        PermissionGuard,
        SessionCookieGuard,
        RoleService,
      ],
    };
  }
}
