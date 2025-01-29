import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  InternalServerErrorException,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";

import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { RoleService } from "../services/role.service";
import { RemovePermissionsDto } from "../dto/remove-permissions.dto";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";

@ApiTags("Roles")
@Controller("v1/roles")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiHeader({
  name: "X-Correlation-Id",
  description: "Correlation ID for request tracing (optional)",
  required: false,
  schema: {
    type: "string",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000",
  },
})
export class RemovePermissionsController {
  constructor(
    private readonly roleService: RoleService,
    private readonly logger: Logger = new Logger(RemovePermissionsController.name),
  ) {}

  @Post("removePermissions")
  @RequirePermissions("com.lotto.service.auth-internal:role:remove-permission")
  @ApiOperation({ summary: "Remove permissions from a role" })
  @ApiResponse({
    status: 200,
    description: "Permissions removed successfully",
    schema: {
      type: "object",
      properties: {
        role_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
        permissions: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Remaining permission IDs after removal",
          example: ["permission-id-1", "permission-id-2"],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "User does not have required permissions",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "User does not have the required permissions",
        },
        error: {
          type: "string",
          example: "ForbiddenException",
        },
        statusCode: {
          type: "number",
          example: 403,
        },
        correlationId: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Role not found",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Role not found",
        },
        error: {
          type: "string",
          example: "Not Found",
        },
        correlation_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  async removePermissions(
    @Request() req: Request,
    @Body() dto: RemovePermissionsDto,
    @CorrelationId() correlationId: string | null,
  ) {
    this.logger.log("Removing permissions from role", { correlationId, roleId: dto.role_id });

    try {
      return await this.roleService.removePermissions(
        dto.role_id,
        dto.permission_ids,
        correlationId,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error removing permissions",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }
} 