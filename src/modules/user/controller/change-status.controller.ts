import {
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
  Request,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { ChangeStatusDto } from "../dto/change-status.dto";
import { UserService } from "../services/user.service";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";

interface RequestWithUser extends Request {
  user: {
    sub: string;
    permissions: string[];
  };
}

@ApiTags("User")
@Controller("v1/users")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ChangeStatusController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger = new Logger(ChangeStatusController.name),
  ) {}

  @Post("changeStatus")
  @RequirePermissions("com.lotto.service.auth-internal:user:change-status")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change user status",
    description:
      "Allows authorized users to toggle user status between active and blocked",
  })
  @ApiResponse({
    status: 200,
    description: "User status changed successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "User status updated successfully",
        },
        status: {
          type: "string",
          example: "active",
        },
        correlation_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Unauthorized",
        },
        error: {
          type: "string",
          example: "Unauthorized",
        },
        correlation_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User does not have required permissions",
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
        correlation_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid user ID",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Invalid user ID",
        },
        error: {
          type: "string",
          example: "Bad Request",
        },
        correlation_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  async changeStatus(
    @Request() req: RequestWithUser,
    @Body() dto: ChangeStatusDto,
    @CorrelationId() correlationId: string | null,
  ) {
    const requestorUserId = req.user.sub;

    this.logger.log("Changing user status", {
      correlationId,
      requestorUserId: requestorUserId,
      targetUserId: dto.user_id,
      newStatus: dto.status,
    });

    try {
      const updatedUser = await this.userService.changeStatus(
        dto.user_id,
        dto.status,
      );

      return {
        message: "User status updated successfully",
        status: updatedUser.status,
        correlation_id: correlationId,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error updating user status",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }
}
