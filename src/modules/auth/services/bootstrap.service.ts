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
    "com.lotto.service.auth-internal:user:list",
    // Role Management
    "com.lotto.service.auth-internal:role:create",
    "com.lotto.service.auth-internal:role:view",
    "com.lotto.service.auth-internal:role:assign-permission",
    "com.lotto.service.auth-internal:role:remove-permission",
    "com.lotto.service.auth-internal:role:delete",
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
      // Check existing permissions
      this.logger.log("Checking existing permissions...", {
        correlationId: bootstrapCorrelationId,
      });
      
      const allRequiredPermissions = [...this.adminPermissions, ...this.basicPermissions];
      const existingPermissions = await this.prisma.permissions.findMany({
        where: {
          name: {
            in: allRequiredPermissions
          }
        }
      });

      const existingPermissionNames = existingPermissions.map(p => p.name);
      const missingPermissions = allRequiredPermissions.filter(
        name => !existingPermissionNames.includes(name)
      );

      let adminPermissionObjects = existingPermissions.filter(p => 
        this.adminPermissions.includes(p.name)
      );
      let basicPermissionObjects = existingPermissions.filter(p => 
        this.basicPermissions.includes(p.name)
      );

      if (missingPermissions.length > 0) {
        this.logger.log(`Creating ${missingPermissions.length} missing permissions...`, {
          correlationId: bootstrapCorrelationId,
          missingPermissions,
        });

        const newPermissions = await Promise.all(
          missingPermissions.map((name) =>
            this.permissionService.createPermission(
              {
                name,
                description: `Default permission: ${name}`,
              },
              bootstrapCorrelationId,
            ),
          ),
        );

        // Update our permission objects arrays
        adminPermissionObjects = [
          ...adminPermissionObjects,
          ...newPermissions.filter(p => this.adminPermissions.includes(p.name))
        ];
        basicPermissionObjects = [
          ...basicPermissionObjects,
          ...newPermissions.filter(p => this.basicPermissions.includes(p.name))
        ];
      } else {
        this.logger.log("All required permissions already exist", {
          correlationId: bootstrapCorrelationId,
        });
      }

      // Check and create/update roles
      this.logger.log("Checking roles...", {
        correlationId: bootstrapCorrelationId,
      });

      // Create or get basic role
      const basicRole = await this.roleService.createRole(
        {
          name: "Basic",
          description: "Basic permission for all users",
        },
        bootstrapCorrelationId,
      );

      // Create or get admin role
      const adminRole = await this.roleService.createRole(
        {
          name: "User Management",
          description: "User and role management",
        },
        bootstrapCorrelationId,
      );

      // Ensure roles have correct permissions
      this.logger.log("Ensuring roles have correct permissions...", {
        correlationId: bootstrapCorrelationId,
      });

      // Assign all permissions (both admin and basic) to admin role since it can only have one role
      await this.roleService.assignPermissions(
        adminRole.id,
        [...adminPermissionObjects, ...basicPermissionObjects].map((p) => p.id),
        bootstrapCorrelationId,
      );

      // Assign basic permissions to basic role
      await this.roleService.assignPermissions(
        basicRole.id,
        basicPermissionObjects.map((p) => p.id),
        bootstrapCorrelationId,
      );

      // Check admin user and their roles
      const adminUser = await this.prisma.users.findFirst({
        where: { username: "admin" },
        include: {
          roles: {
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
          }
        }
      });

      if (!adminUser) {
        const password = this.generateSecurePassword();

        this.logger.log("Creating admin user...", {
          correlationId: bootstrapCorrelationId,
        });
        const user = await this.userService.createUser(
          "admin",
          password,
          bootstrapCorrelationId,
        );

        // Assign both admin and basic roles to user
        this.logger.log("Assigning roles to admin user...", {
          correlationId: bootstrapCorrelationId,
        });
        
        // Assign both roles at once
        const updatedUser = await this.userService.assignRole(
          user.id, 
          [adminRole.id, basicRole.id],
          bootstrapCorrelationId
        );

        this.logger.log("Admin user created with roles:", {
          correlationId: bootstrapCorrelationId,
          userId: updatedUser.user_id,
          roleNames: updatedUser.roles,
        });

        // Log admin credentials (only on first creation)
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
        // Check if admin user has all required roles
        const userRoleNames = adminUser.roles.map(ur => ur.role.name);
        const missingRoles = [];
        
        if (!userRoleNames.includes("User Management")) {
          missingRoles.push(adminRole);
        }
        if (!userRoleNames.includes("Basic")) {
          missingRoles.push(basicRole);
        }

        if (missingRoles.length > 0) {
          this.logger.log(`Assigning missing roles to admin user: ${missingRoles.map(r => r.name).join(", ")}`, {
            correlationId: bootstrapCorrelationId,
          });

          // Assign all missing roles at once
          await this.userService.assignRole(
            adminUser.id, 
            missingRoles.map(role => role.id),
            bootstrapCorrelationId
          );

          this.logger.log("Admin user roles updated", {
            correlationId: bootstrapCorrelationId,
            userId: adminUser.id,
            roles: [...userRoleNames, ...missingRoles.map(r => r.name)],
          });
        } else {
          this.logger.log("Admin user already has all required roles", {
            correlationId: bootstrapCorrelationId,
            userId: adminUser.id,
            roles: userRoleNames,
          });
        }
      }

      this.logger.log("System bootstrap completed successfully", {
        correlationId: bootstrapCorrelationId,
      });
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
