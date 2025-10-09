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
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { AssignRoleDto } from "../dto/assign-role.dto";
import { UserService } from "../services/user.service";

@ApiTags("Users")
@Controller("v1/users")
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
export class AssignRoleController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger = new Logger(AssignRoleController.name),
  ) {}

  @Post("assignRole")
  @RequirePermissions("com.lotto.service.sso-internal:user:assign-role")
  @ApiOperation({ summary: "Assign roles to a user" })
  @ApiResponse({
    status: 201,
    description: "Roles assigned successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Success",
        },
        status_code: {
          type: "number",
          example: 201,
        },
        meta: {
          type: "object",
          properties: {
            correlation_id: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
        },
        data: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            roles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role_id: {
                    type: "string",
                    example: "456e7890-f12d-34e5-a678-901234567890",
                  },
                  name: {
                    type: "string",
                    example: "User Management",
                  },
                },
              },
              description: "Assigned roles",
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "User not found",
        },
        error: {
          type: "string",
          example: "Not Found",
        },
        status_code: {
          type: "number",
          example: 404,
        },
        meta: {
          type: "object",
          properties: {
            correlation_id: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
        },
      },
    },
  })
  async assignRole(
    @Body() dto: AssignRoleDto,
    @CorrelationId() correlationId: string,
  ) {
    try {
      const result = await this.userService.assignRole(
        dto.user_id,
        dto.role_ids,
        correlationId,
      );

      return {
        message: "Success",
        status_code: 201,
        meta: {
          correlation_id: correlationId,
        },
        data: {
          user_id: result.user_id,
          roles: result.roles.map((role) => ({
            role_id: role.role_id,
            name: role.name,
          })),
        },
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error assigning roles",
          error: "Internal Server Error",
          status_code: 500,
          meta: {
            correlation_id: correlationId,
          },
        });
      }
      throw error;
    }
  }
}
