import * as crypto from "crypto";

import {
  Injectable,
  Logger,
  OnModuleInit,
  Inject,
  forwardRef,
} from "@nestjs/common";

import { PermissionService } from "./permission.service";
import { RoleService } from "./role.service";
import { UUID } from "../../../common/value-object/uuid.value-object";
import { PrismaService } from "../../prisma/prisma.service";
import { UserService } from "../../user/services/user.service";

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly adminPermissions = [
    // User Management
    "com.lotto.service.auth-internal:user:create",
    "com.lotto.service.auth-internal:user:change-other-users-password",
    "com.lotto.service.auth-internal:user:change-status",
    "com.lotto.service.auth-internal:user:assign-role",
    "com.lotto.service.auth-internal:user:remove-role",
    // Role Management
    "com.lotto.service.auth-internal:role:create",
    "com.lotto.service.auth-internal:role:view",
    "com.lotto.service.auth-internal:role:assign-permission",
    "com.lotto.service.auth-internal:role:remove-permission",
    // Permission Management
    "com.lotto.service.auth-internal:permission:create",
    "com.lotto.service.auth-internal:permission:view",
    "com.lotto.service.auth-internal:permission:delete",
  ];

  private readonly basicPermissions = [
    "com.lotto.service.auth-internal:user:view-profile",
    "com.lotto.service.auth-internal:user:change-password",
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly logger: Logger,
    private readonly isTestEnvironment: boolean = false,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async onModuleInit() {
    if (this.isTestEnvironment) {
      this.logger.log("Skipping system bootstrap in test environment");
      return;
    }
    await this.bootstrapSystem();
  }

  private async bootstrapSystem() {
    this.logger.log("Starting system bootstrap...");

    // Generate a bootstrap correlation ID
    const bootstrapCorrelationId = `${new UUID().toString()}`;

    try {
      // Create default permissions
      this.logger.log("Creating default permissions...", {
        correlationId: bootstrapCorrelationId,
      });
      const adminPermissionObjects = await Promise.all(
        this.adminPermissions.map((name) =>
          this.permissionService.createPermission(
            {
              name,
              description: `Default permission: ${name}`,
            },
            bootstrapCorrelationId,
          ),
        ),
      );

      const basicPermissionObjects = await Promise.all(
        this.basicPermissions.map((name) =>
          this.permissionService.createPermission(
            {
              name,
              description: `Basic permission: ${name}`,
            },
            bootstrapCorrelationId,
          ),
        ),
      );

      // Create basic role
      this.logger.log("Creating Default Basic role...", {
        correlationId: bootstrapCorrelationId,
      });
      const basicRole = await this.roleService.createRole(
        {
          name: "Basic",
          description: "Basic permission for all users",
        },
        bootstrapCorrelationId,
      );

      // Create admin role
      this.logger.log("Creating User Management role...", {
        correlationId: bootstrapCorrelationId,
      });
      const adminRole = await this.roleService.createRole(
        {
          name: "User Management",
          description: "User and role management",
        },
        bootstrapCorrelationId,
      );

      // Assign all permissions to admin role
      this.logger.log("Assigning permissions to User Management role...", {
        correlationId: bootstrapCorrelationId,
      });
      await this.roleService.assignPermissions(
        adminRole.id,
        adminPermissionObjects.map((p) => p.id),
        bootstrapCorrelationId,
      );

      // Assign basic permissions to basic role
      this.logger.log("Assigning permissions to Basic role...", {
        correlationId: bootstrapCorrelationId,
      });
      await this.roleService.assignPermissions(
        basicRole.id,
        basicPermissionObjects.map((p) => p.id),
        bootstrapCorrelationId,
      );

      // Check if admin user exists
      const adminUser = await this.prisma.users.findFirst({
        where: { username: "admin" },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      if (!adminUser) {
        const password = this.generateSecurePassword();

        this.logger.log("Creating User Management user...", {
          correlationId: bootstrapCorrelationId,
        });
        const user = await this.userService.createUser(
          "admin",
          password,
          bootstrapCorrelationId,
        );

        // Assign User Management role to admin user
        this.logger.log("Assigning User Management role to admin user...", {
          correlationId: bootstrapCorrelationId,
        });
        let updatedUser = await this.userService.assignRole(user.id, adminRole.id, bootstrapCorrelationId);

        // Assign Basic permission to admin user
        this.logger.log("Assigning Basic permission to admin user...", {
          correlationId: bootstrapCorrelationId,
        });
        updatedUser = await this.userService.assignRole(user.id, basicRole.id, bootstrapCorrelationId);

        this.logger.log("Admin user created with roles and permissions:", {
          correlationId: bootstrapCorrelationId,
          userId: updatedUser.user_id,
          roleId: updatedUser.role_id,
          roleName: updatedUser.user.roleName,
          permissions: updatedUser.user.permissions
        });

        // Log admin credentials (only on first deployment)
        this.logger.warn("==================================================");
        this.logger.warn("IMPORTANT: Default admin user has been created", {
          correlationId: bootstrapCorrelationId,
        });
        this.logger.warn(
          "Please save these credentials and change the password",
          { correlationId: bootstrapCorrelationId },
        );
        this.logger.warn("Username: admin", {
          correlationId: bootstrapCorrelationId,
        });
        this.logger.warn(`Password: ${password}`, {
          correlationId: bootstrapCorrelationId,
        });
        this.logger.warn("==================================================");
      } else {
        // If admin user exists but doesn't have the roles, assign them
        if (!adminUser.role || adminUser.role.name !== "User Management") {
          this.logger.log("Assigning User Management role to existing admin user...", {
            correlationId: bootstrapCorrelationId,
          });
          let updatedUser = await this.userService.assignRole(adminUser.id, adminRole.id, bootstrapCorrelationId);
          
          this.logger.log("Assigning Basic role to existing admin user...", {
            correlationId: bootstrapCorrelationId,
          });
          updatedUser = await this.userService.assignRole(adminUser.id, basicRole.id, bootstrapCorrelationId);
          
          this.logger.log("Admin user updated with roles and permissions:", {
            correlationId: bootstrapCorrelationId,
            userId: updatedUser.user_id,
            roleId: updatedUser.role_id,
            roleName: updatedUser.user.roleName,
            permissions: updatedUser.user.permissions
          });
        }
      }
    } catch (error) {
      this.logger.error("Error during system bootstrap:", error, {
        correlationId: bootstrapCorrelationId,
      });
      throw error;
    }
  }

  private generateSecurePassword(): string {
    const length = 16;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }
}
