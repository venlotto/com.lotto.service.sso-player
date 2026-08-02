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
import { RemoveRolesDto } from "../dto/remove-roles.dto";
import { UserService } from "../services/user.service";

interface RemoveRolesResponse {
  message: string;
  status_code: number;
  meta: {
    correlation_id: string;
  };
  data: {
    user_id: string;
    roles: Array<{
      role_id: string;
      name: string;
    }>;
  };
}

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
export class RemoveRolesController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger = new Logger(RemoveRolesController.name),
  ) {}

  @Post("removeRoles")
  @RequirePermissions("com.lotto.service.sso-internal:user:remove-role")
  @ApiOperation({ summary: "Remove roles from a user" })
  @ApiResponse({
    status: 200,
    description: "Roles removed successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Success",
        },
        status_code: {
          type: "number",
          example: 200,
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
              description: "Remaining roles after removal",
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
  async removeRoles(
    @Body() dto: RemoveRolesDto,
    @CorrelationId() correlationId: string,
  ): Promise<RemoveRolesResponse> {
    try {
      const result = await this.userService.removeRoles(
        dto.user_id,
        dto.role_ids,
        correlationId,
      );

      return {
        message: "Success",
        status_code: 200,
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
          message: "Error removing roles",
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
