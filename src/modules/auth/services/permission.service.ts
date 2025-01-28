import { Injectable, Logger, ConflictException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { CreatePermissionDto } from "../dto/create-permission.dto";

@Injectable()
export class PermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger = new Logger(PermissionService.name),
  ) {}

  /**
   * Creates a new permission or returns existing one if it already exists
   * @param dto The permission data to create
   * @param correlationId Correlation ID for request tracking
   * @returns The created or existing permission
   */
  async createPermission(dto: CreatePermissionDto, correlationId: string) {
    this.logger.log("Creating permission", { correlationId, name: dto.name });

    const existingPermission = await this.prisma.permissions.findUnique({
      where: { name: dto.name },
    });

    if (existingPermission) {
      this.logger.log("Permission already exists, returning existing", {
        correlationId,
        name: dto.name,
      });
      return existingPermission;
    }

    return this.prisma.permissions.create({
      data: dto,
    });
  }

  async getAllPermissions(correlationId: string) {
    this.logger.log("Getting all permissions", { correlationId });

    return this.prisma.permissions.findMany({});
  }

  async createOrUpdatePermission(dto: CreatePermissionDto, correlationId: string) {
    this.logger.log("Creating or updating permission", { correlationId, name: dto.name });

    const existingPermission = await this.prisma.permissions.findUnique({
      where: { name: dto.name },
    });

    if (existingPermission) {
      this.logger.log("Permission already exists, skipping", {
        correlationId,
        name: dto.name,
      });
      return existingPermission;
    }

    return this.prisma.permissions.create({
      data: dto,
    });
  }
}
