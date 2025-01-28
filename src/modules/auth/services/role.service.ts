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

  async createRole(dto: CreateRoleDto, correlationId: string) {
    this.logger.log("Creating role", { correlationId, name: dto.name });

    const existingRole = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existingRole) {
      this.logger.warn("Role already exists", {
        correlationId,
        name: dto.name,
      });
      throw new ConflictException({
        message: "Role already exists",
        error: "Conflict",
        correlation_id: correlationId,
      });
    }

    return this.prisma.role.create({
      data: dto,
    });
  }

  async assignPermissions(
    roleId: string,
    dto: AssignPermissionsDto,
    correlationId: string,
  ): Promise<Role> {
    this.logger.log("Assigning permissions to role", { correlationId, roleId });

    const role = await this.prisma.role.findUnique({
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
    const permissions = await this.prisma.permission.findMany({
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
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Add new permissions
    const rolePermissions = dto.permission_ids.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    await this.prisma.rolePermission.createMany({
      data: rolePermissions,
    });

    return this.getRoleWithPermissions(roleId, correlationId);
  }

  async getRoleWithPermissions(roleId: string, correlationId: string) {
    this.logger.log("Getting role with permissions", { correlationId, roleId });

    const role = await this.prisma.role.findUnique({
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

    return this.prisma.role.findMany({
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

    const role = await this.prisma.role.findUnique({
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
