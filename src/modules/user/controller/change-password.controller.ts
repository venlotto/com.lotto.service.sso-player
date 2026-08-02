import {
  Body,
  Controller,
  Logger,
  Post,
  Request,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request as ExpressRequest } from "express";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { UserService } from "../services/user.service";

interface RequestUser {
  sub: string;
  permissions?: string[];
}

interface AuthenticatedRequest extends ExpressRequest {
  user: RequestUser;
}

interface ChangePasswordResponse {
  message: string;
  status_code: number;
  meta: {
    correlation_id: string | null;
  };
}

@ApiTags("User")
@Controller("v1/users")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ChangePasswordController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger = new Logger(ChangePasswordController.name),
  ) {}

  @Post("changePassword")
  @ApiBearerAuth()
  @RequirePermissions("com.lotto.service.sso-internal:user:change-password")
  @ApiOperation({
    summary: "Change password",
    description:
      "Allows a user to change their own password or admin to change other user's password",
  })
  @ApiResponse({
    status: 200,
    description: "Password changed successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Password changed successfully",
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
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Current password is required when changing own password",
  })
  @ApiResponse({
    status: 401,
    description: "Current password is incorrect",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Current password is incorrect",
        },
        error: {
          type: "string",
          example: "UnauthorizedException",
        },
        status_code: {
          type: "number",
          example: 401,
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
        status_code: {
          type: "number",
          example: 403,
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
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
    @CorrelationId() correlationId: string | null,
  ): Promise<ChangePasswordResponse> {
    const userId = req.user.sub;
    const userPermissions = req.user.permissions ?? [];

    // First check if user has admin permission to change other users' passwords
    const hasAdminPermission = userPermissions.includes(
      "com.lotto.service.sso-internal:user:change-other-users-password",
    );

    // If they have admin permission and provided a user_id, proceed with admin flow
    if (hasAdminPermission && dto.user_id !== undefined && dto.user_id !== "") {
      this.logger.log("Admin changing user password", {
        correlationId,
        adminUserId: userId,
        targetUserId: dto.user_id,
      });

      try {
        await this.userService.changePassword(
          dto.user_id,
          null,
          dto.new_password,
          correlationId,
        );
        return {
          message: "Password changed successfully",
          status_code: 200,
          meta: {
            correlation_id: correlationId,
          },
        };
      } catch (error) {
        this.logger.error(error.message, error.stack, { correlationId });
        throw new InternalServerErrorException({
          message: "Error changing password",
          error: "InternalServerError",
          status_code: 500,
          meta: {
            correlation_id: correlationId,
          },
        });
      }
    }

    // User changing their own password
    this.logger.log("User changing own password", { correlationId, userId });

    if (dto.current_password === undefined || dto.current_password === "") {
      throw new BadRequestException({
        message: "Current password is required when changing own password",
        error: "BadRequestException",
        status_code: 400,
        meta: {
          correlation_id: correlationId,
        },
      });
    }

    try {
      await this.userService.changePassword(
        userId,
        dto.current_password,
        dto.new_password,
        correlationId,
      );

      return {
        message: "Password changed successfully",
        status_code: 200,
        meta: {
          correlation_id: correlationId,
        },
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });

      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException({
          message: error.message,
          error: error.name,
          status_code: 401,
          meta: {
            correlation_id: correlationId,
          },
        });
      }

      throw new InternalServerErrorException({
        message: "Error changing password",
        error: "InternalServerError",
        status_code: 500,
        meta: {
          correlation_id: correlationId,
        },
      });
    }
  }
}
