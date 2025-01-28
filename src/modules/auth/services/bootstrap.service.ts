import * as crypto from "crypto";

import {
  Injectable,
  Logger,
  OnModuleInit,
  Inject,
  forwardRef,
} from "@nestjs/common";

import { AuthService } from "./auth.service";
import { PermissionService } from "./permission.service";
import { RoleService } from "./role.service";
import { UUID } from "../../../common/value-object/uuid.value-object";
import { PrismaService } from "../../prisma/prisma.service";
import { UserService } from "../../user/services/user.service";

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly defaultPermissions = [
    // User Management
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
    "user:activate",
    "user:block",
    "user:change-password",
    // Role Management
    "role:create",
    "role:read",
    "role:update",
    "role:delete",
    "role:assign",
    // Permission Management
    "permission:create",
    "permission:read",
    "permission:update",
    "permission:delete",
    "permission:assign",
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly authService: AuthService,
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

    // Check if system is already bootstrapped
    const adminRole = await this.prisma.role.findFirst({
      where: { name: "admin" },
    });

    if (adminRole) {
      this.logger.log("System already bootstrapped, skipping initialization", {
        correlationId: bootstrapCorrelationId,
      });
      return;
    }

    try {
      // Create default permissions
      this.logger.log("Creating default permissions...", {
        correlationId: bootstrapCorrelationId,
      });
      const permissions = await Promise.all(
        this.defaultPermissions.map((name) =>
          this.permissionService.createPermission(
            {
              name,
              description: `Default permission: ${name}`,
            },
            bootstrapCorrelationId,
          ),
        ),
      );

      // Create admin role
      this.logger.log("Creating admin role...", {
        correlationId: bootstrapCorrelationId,
      });
      const role = await this.roleService.createRole(
        {
          name: "admin",
          description: "System administrator role",
        },
        bootstrapCorrelationId,
      );

      // Assign all permissions to admin role
      this.logger.log("Assigning permissions to admin role...", {
        correlationId: bootstrapCorrelationId,
      });
      await this.roleService.assignPermissions(
        role.id,
        {
          permission_ids: permissions.map((p) => p.id),
        },
        bootstrapCorrelationId,
      );

      const password = this.generateSecurePassword();

      this.logger.log("Creating admin user...", {
        correlationId: bootstrapCorrelationId,
      });
      await this.userService.createUser(
        "admin",
        password,
        bootstrapCorrelationId,
      );

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

      this.logger.log("System bootstrap completed successfully", {
        correlationId: bootstrapCorrelationId,
      });
    } catch (error) {
      this.logger.error("Error during system bootstrap", error.stack);
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
