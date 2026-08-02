import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRoleDto } from "../dto/create-role.dto";

// Domain mirror of the roles table row; services must not import
// Prisma-generated types (repositories own Prisma).
export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

interface RolePermissionAssignmentResponse {
  role_id: string;
  permissions: string[];
}

interface RoleWithPermissionsResponse {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  permissions: Array<{
    permission_id: string;
    name: string;
  }>;
}

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger = new Logger(RoleService.name),
  ) {}

  /**
   * Creates a new role or returns existing one if it already exists
   * @param dto The role data to create
   * @param correlationId Correlation ID for request tracking
   * @returns The created or existing role
   */
  async createRole(dto: CreateRoleDto, correlationId: string): Promise<RoleRecord> {
    this.logger.log("Creating role", { correlationId, name: dto.name });

    const existingRole = await this.prisma.roles.findUnique({
      where: { name: dto.name },
    });

    if (existingRole) {
      this.logger.log("Role already exists, returning existing", {
        correlationId,
        name: dto.name,
      });
      return existingRole;
    }

    return this.prisma.roles.create({
      data: dto,
    });
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
    correlationId: string,
  ): Promise<RolePermissionAssignmentResponse> {
    try {
      // Check if role exists
      const role = await this.prisma.roles.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!role) {
        throw new NotFoundException({
          message: "Role not found",
          error: "Not Found",
          correlation_id: correlationId,
        });
      }

      // Verify all permissions exist
      const existingPermissions = await this.prisma.permissions.findMany({
        where: {
          id: {
            in: permissionIds,
          },
        },
      });

      const foundPermissionIds = existingPermissions.map((p) => p.id);
      const nonExistentPermissions = permissionIds.filter(
        (id) => !foundPermissionIds.includes(id),
      );

      if (nonExistentPermissions.length > 0) {
        throw new NotFoundException({
          message: `Permissions not found: ${nonExistentPermissions.join(", ")}`,
          error: "Not Found",
          correlation_id: correlationId,
        });
      }

      // Get existing permission IDs for this role
      const existingRolePermissionIds = role.permissions.map(
        (p) => p.permission.id,
      );

      // Filter out permissions that already exist
      const newPermissionIds = permissionIds.filter(
        (id) => !existingRolePermissionIds.includes(id),
      );

      if (newPermissionIds.length === 0) {
        this.logger.log("All permissions already assigned to role", {
          correlationId,
          roleId,
        });
        return {
          role_id: roleId,
          permissions: existingRolePermissionIds,
        };
      }

      // Create new role-permission associations
      await this.prisma.roles_permissions.createMany({
        data: newPermissionIds.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        })),
      });

      // Return all permissions (existing + newly added)
      return {
        role_id: roleId,
        permissions: [...existingRolePermissionIds, ...newPermissionIds],
      };
    } catch (error) {
      this.logger.error("Error assigning permissions to role", error.stack, {
        correlationId,
      });
      throw error;
    }
  }

  async removePermissions(
    roleId: string,
    permissionIds: string[],
    correlationId: string,
  ): Promise<RolePermissionAssignmentResponse> {
    try {
      // Check if role exists
      const role = await this.prisma.roles.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!role) {
        throw new NotFoundException({
          message: "Role not found",
          error: "Not Found",
          correlation_id: correlationId,
        });
      }

      // Remove role-permission associations
      await this.prisma.roles_permissions.deleteMany({
        where: {
          role_id: roleId,
          permission_id: {
            in: permissionIds,
          },
        },
      });

      // Get remaining permissions
      const updatedRole = await this.prisma.roles.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return {
        role_id: roleId,
        permissions: updatedRole
          ? updatedRole.permissions.map((p) => p.permission.id)
          : [],
      };
    } catch (error) {
      this.logger.error("Error removing permissions from role", error.stack, {
        correlationId,
      });
      throw error;
    }
  }

  async getRoleWithPermissions(
    roleId: string,
    correlationId: string,
  ): Promise<RoleWithPermissionsResponse> {
    this.logger.log("Getting role with permissions", { correlationId, roleId });

    const role = await this.prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException({
        message: "Role not found",
        error: "Not Found",
        correlation_id: correlationId,
      });
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions: role.permissions.map((p) => ({
        permission_id: p.permission.id,
        name: p.permission.name,
      })),
    };
  }

  async getAllRoles(
    correlationId: string,
  ): Promise<RoleWithPermissionsResponse[]> {
    this.logger.log("Getting all roles", { correlationId });

    const roles = await this.prisma.roles.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions: role.permissions.map((p) => ({
        permission_id: p.permission.id,
        name: p.permission.name,
      })),
    }));
  }

  async validateRoleExists(
    roleName: string,
    correlationId: string,
  ): Promise<void> {
    this.logger.log("Validating role exists", { correlationId, roleName });

    const role = await this.prisma.roles.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException({
        message: `Role ${roleName} not found`,
        error: "Not Found",
        correlation_id: correlationId,
      });
    }
  }

  async deleteRole(roleId: string, correlationId: string): Promise<void> {
    this.logger.log("Deleting role", { correlationId, roleId });

    // Check if role exists
    const role = await this.prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
        users: true,
      },
    });

    if (!role) {
      throw new NotFoundException({
        message: "Role not found",
        error: "Not Found",
        correlation_id: correlationId,
      });
    }

    // Check if role has any permissions
    if (role.permissions.length > 0) {
      throw new ConflictException({
        message: "Cannot delete role that has permissions assigned",
        error: "Conflict",
        correlation_id: correlationId,
      });
    }

    // Check if role is assigned to any users
    if (role.users.length > 0) {
      throw new ConflictException({
        message: "Cannot delete role that is assigned to users",
        error: "Conflict",
        correlation_id: correlationId,
      });
    }

    // Delete role
    await this.prisma.roles.delete({
      where: { id: roleId },
    });
  }
}
