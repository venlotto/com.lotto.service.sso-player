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
import { AssignPermissionsDto } from "../dto/assign-permissions.dto";

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
export class AssignPermissionsController {
  constructor(
    private readonly roleService: RoleService,
    private readonly logger: Logger = new Logger(AssignPermissionsController.name),
  ) {}

  @Post("assignPermissions")
  @RequirePermissions("com.lotto.service.auth-internal:role:assign-permission")
  @ApiOperation({ summary: "Assign permissions to a role" })
  @ApiResponse({
    status: 200,
    description: "Permissions assigned successfully",
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
  async assignPermissions(
    @Request() req: Request,
    @Body() dto: AssignPermissionsDto,
  ) {
    const correlationId = req["correlationId"];
    this.logger.log("Assigning permissions to role", { correlationId, roleId: dto.role_id });

    try {
      return await this.roleService.assignPermissions(
        dto.role_id,
        { permission_ids: dto.permission_ids },
        correlationId,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error assigning permissions",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }
} 