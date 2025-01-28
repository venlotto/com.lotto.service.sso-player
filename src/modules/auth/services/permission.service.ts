import { Injectable, Logger, ConflictException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { CreatePermissionDto } from "../dto/create-permission.dto";

@Injectable()
export class PermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger = new Logger(PermissionService.name),
  ) {}

  async createPermission(dto: CreatePermissionDto, correlationId: string) {
    this.logger.log("Creating permission", { correlationId, name: dto.name });

    const existingPermission = await this.prisma.permission.findUnique({
      where: { name: dto.name },
    });

    if (existingPermission) {
      this.logger.error("Permission already exists", {
        correlationId,
        name: dto.name,
      });
      throw new ConflictException({
        message: "Permission already exists",
        error: "Conflict",
        correlation_id: correlationId,
      });
    }

    return this.prisma.permission.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async getAllPermissions(correlationId: string) {
    this.logger.log("Getting all permissions", { correlationId });

    return this.prisma.permission.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}
