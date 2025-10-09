import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as bcrypt from "bcrypt";

import { AppModule } from "../app/app.module";
import { PrismaService } from "../modules/prisma/prisma.service";

const logger = new Logger("CreateTestUser");

async function createTestUser(): Promise<void> {
  try {
    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    // Test user credentials
    const username = "testuser";
    const password = "Test1234!";

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: { username },
    });

    if (existingUser) {
      logger.warn(`User '${username}' already exists. Updating password...`);

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user
      await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          status: "ACTIVE",
        },
      });

      logger.log("User password updated successfully");
    } else {
      logger.log("Creating new test user...");

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.users.create({
        data: {
          username,
          password: hashedPassword,
          status: "ACTIVE",
        },
      });

      logger.log(`User created with ID: ${user.id}`);
    }

    // Get user
    const user = await prisma.users.findFirst({
      where: { username },
    });

    if (!user) {
      logger.error("Failed to find created user");
      await app.close();
      process.exit(1);
    }

    // Find or create admin role
    let adminRole = await prisma.roles.findFirst({
      where: { name: "admin" },
    });

    if (!adminRole) {
      logger.log("Admin role not found, creating it...");
      adminRole = await prisma.roles.create({
        data: {
          name: "admin",
          description: "Administrator with full permissions",
        },
      });
      logger.log(`Admin role created with ID: ${adminRole.id}`);
    }

    // Assign admin role to user (if not already assigned)
    const existingUserRole = await prisma.users_roles.findFirst({
      where: {
        user_id: user.id,
        role_id: adminRole.id,
      },
    });

    if (!existingUserRole) {
      await prisma.users_roles.create({
        data: {
          user_id: user.id,
          role_id: adminRole.id,
        },
      });
      logger.log("Admin role assigned to user");
    } else {
      logger.log("User already has admin role");
    }

    // Create permissions if they don't exist
    const permissions = [
      {
        name: "com.lotto.service.sso-internal:user:create",
        description: "Create users",
      },
      {
        name: "com.lotto.service.sso-internal:user:read",
        description: "Read users",
      },
      {
        name: "com.lotto.service.sso-internal:user:update",
        description: "Update users",
      },
      {
        name: "com.lotto.service.sso-internal:user:delete",
        description: "Delete users",
      },
      {
        name: "com.lotto.service.sso-internal:role:create",
        description: "Create roles",
      },
      {
        name: "com.lotto.service.sso-internal:role:read",
        description: "Read roles",
      },
      {
        name: "com.lotto.service.sso-internal:role:update",
        description: "Update roles",
      },
      {
        name: "com.lotto.service.sso-internal:role:delete",
        description: "Delete roles",
      },
      {
        name: "com.lotto.service.sso-internal:permission:create",
        description: "Create permissions",
      },
      {
        name: "com.lotto.service.sso-internal:permission:read",
        description: "Read permissions",
      },
      {
        name: "com.lotto.service.sso-internal:permission:update",
        description: "Update permissions",
      },
      {
        name: "com.lotto.service.sso-internal:permission:delete",
        description: "Delete permissions",
      },
    ];

    logger.log("Creating permissions...");
    for (const perm of permissions) {
      const existing = await prisma.permissions.findFirst({
        where: { name: perm.name },
      });

      if (!existing) {
        const created = await prisma.permissions.create({
          data: perm,
        });
        logger.log(`Created permission: ${perm.name}`);

        // Assign permission to admin role
        await prisma.roles_permissions.create({
          data: {
            role_id: adminRole.id,
            permission_id: created.id,
          },
        });
        logger.log(`Assigned permission to admin role: ${perm.name}`);
      } else {
        // Check if permission is assigned to admin role
        const rolePermission = await prisma.roles_permissions.findFirst({
          where: {
            role_id: adminRole.id,
            permission_id: existing.id,
          },
        });

        if (!rolePermission) {
          await prisma.roles_permissions.create({
            data: {
              role_id: adminRole.id,
              permission_id: existing.id,
            },
          });
          logger.log(`Assigned existing permission to admin role: ${perm.name}`);
        }
      }
    }

    // Get final user details
    const finalUser = await prisma.users.findFirst({
      where: { username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    logger.warn("==================================================");
    logger.warn("SUCCESS: Test user created with full permissions");
    logger.warn("==================================================");
    logger.warn("Username: testuser");
    logger.warn("Password: Test1234!");
    logger.warn("");
    logger.warn("Roles:");
    finalUser?.roles.forEach((ur) => {
      logger.warn(`  - ${ur.role.name}`);
    });
    logger.warn("");
    logger.warn("Permissions:");
    finalUser?.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        logger.warn(`  - ${rp.permission.name}`);
      });
    });
    logger.warn("==================================================");

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error("Error creating test user:", error);
    process.exit(1);
  }
}

createTestUser();
