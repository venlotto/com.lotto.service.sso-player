import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { AssignPermissionsDto } from "../dto/assign-permissions.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { RoleService } from "../services/role.service";

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
    private readonly logger: Logger = new Logger(
      AssignPermissionsController.name,
    ),
  ) {}

  @Post("assignPermissions")
  @RequirePermissions("com.lotto.service.sso-internal:role:assign-permission")
  @ApiOperation({
    summary: "Assign permissions to a role",
    description:
      "Assigns multiple permissions to a role. Skips permissions that are already assigned to the role.",
  })
  @ApiResponse({
    status: 200,
    description: "Permissions assigned successfully",
    schema: {
      type: "object",
      properties: {
        role_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
        permission_ids: {
          type: "array",
          items: {
            type: "string",
          },
          example: [
            "456e7890-f12d-34e5-a678-901234567890",
            "789e0123-f45d-67e8-a901-234567890123",
          ],
        },
        role: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            name: {
              type: "string",
              example: "admin",
            },
            permissions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  permission_id: {
                    type: "string",
                    example: "456e7890-f12d-34e5-a678-901234567890",
                  },
                  name: {
                    type: "string",
                    example: "com.lotto.service.sso-internal:user:create",
                  },
                },
              },
            },
          },
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
  async assignPermissions(
    @Body() dto: AssignPermissionsDto,
    @CorrelationId() correlationId: string | null,
  ): Promise<{ role_id: string; permissions: string[] }> {
    this.logger.log("Assigning permissions to role", {
      correlationId,
      roleId: dto.role_id,
      permissionCount: dto.permission_ids.length,
    });

    try {
      return await this.roleService.assignPermissions(
        dto.role_id,
        dto.permission_ids,
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
