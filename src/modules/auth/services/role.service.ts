import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { AssignPermissionsDto } from "../dto/assign-permissions.dto";
import { CreateRoleDto } from "../dto/create-role.dto";
import { Role } from "../entity/role.entity";

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
  async createRole(dto: CreateRoleDto, correlationId: string) {
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
    dto: AssignPermissionsDto,
    correlationId: string,
  ): Promise<Role> {
    this.logger.log("Assigning permissions to role", { correlationId, roleId });

    const role = await this.prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException({
        message: "Role not found",
        error: "Not Found",
        correlation_id: correlationId,
      });
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permissions.findMany({
      where: { id: { in: dto.permission_ids } },
    });

    if (permissions.length !== dto.permission_ids.length) {
      throw new BadRequestException({
        message: "One or more permissions not found",
        error: "Bad Request",
        correlation_id: correlationId,
      });
    }

    // Remove existing permissions
    await this.prisma.rolepermissions.deleteMany({
      where: { role_id: roleId },
    });

    // Add new permissions
    const rolePermissions = dto.permission_ids.map((permissionId) => ({
      role_id: roleId,
      permission_id: permissionId,
    }));

    await this.prisma.rolepermissions.createMany({
      data: rolePermissions,
    });

    const updatedRole = await this.getRoleWithPermissions(roleId, correlationId);
    
    return new Role({
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      createdAt: updatedRole.created_at,
      updatedAt: updatedRole.updated_at,
      permissions: updatedRole.permissions.map(rp => ({
        permission: {
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description
        }
      }))
    });
  }

  async getRoleWithPermissions(roleId: string, correlationId: string) {
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

    return role;
  }

  async getAllRoles(correlationId: string) {
    this.logger.log("Getting all roles", { correlationId });

    return this.prisma.roles.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
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
}
