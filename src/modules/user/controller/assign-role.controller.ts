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

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { UserService } from "../services/user.service";
import { AssignRoleDto } from "../dto/assign-role.dto";

@ApiTags("User")
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
  @RequirePermissions("com.lotto.service.auth-internal:user:assign-role")
  @ApiOperation({
    summary: "Assign role to user",
    description: "Assigns a role to a user and updates their permissions accordingly",
  })
  @ApiResponse({
    status: 200,
    description: "Role assigned successfully",
    schema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
        role_id: {
          type: "string",
          example: "456e7890-f12d-34e5-a678-901234567890",
        },
        user: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            username: {
              type: "string",
              example: "john.doe",
            },
            role: {
              type: "string",
              example: "admin",
            },
            status: {
              type: "string",
              example: "active",
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
    description: "User or role not found",
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
        correlation_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  async assignRole(
    @Request() req: Request,
    @Body() dto: AssignRoleDto,
  ) {
    const correlationId = req["correlationId"];
    this.logger.log("Assigning role to user", { correlationId, userId: dto.user_id, roleId: dto.role_id });

    try {
      return await this.userService.assignRole(dto.user_id, dto.role_id, correlationId);
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error assigning role to user",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }
} 