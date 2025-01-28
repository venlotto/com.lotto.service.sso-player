import {
  Body,
  Controller,
  Logger,
  Post,
  Request,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
  Param,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { AssignRoleDto } from "../dto/assign-role.dto";
import { UserService } from "../services/user.service";

interface RequestWithUser extends Request {
  user: {
    sub: string;
    permissions: string[];
  };
}

@ApiTags("User")
@Controller("v1/users")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserManagementController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger = new Logger(UserManagementController.name),
  ) {}

  @Post("changePassword")
  @ApiBearerAuth()
  @RequirePermissions("com.lotto.service.auth-internal:user:change-password")
  @ApiOperation({
    summary: "Change own password",
    description: "Allows a user to change their own password",
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
  async changeOwnPassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    const correlationId = req["correlationId"];
    const userId = req.user.sub;

    this.logger.log("Changing own password", { correlationId, userId });

    try {
      await this.userService.changePassword(
        userId,
        dto.current_password,
        dto.new_password,
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

  @Post(":userId/changePassword")
  @ApiBearerAuth()
  @RequirePermissions("com.lotto.service.auth-internal:user:change-other-users-password")
  @ApiOperation({
    summary: "Change other user's password",
    description: "Allows authorized users to change another user's password",
  })
  @ApiParam({
    name: "userId",
    description: "ID of the user whose password needs to be changed",
    type: "string",
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
          example: "NotFoundException",
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
  async changeOtherUserPassword(
    @Request() req: any,
    @Param("userId") targetUserId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    const correlationId = req["correlationId"];
    const adminUserId = req.user.sub;

    this.logger.log("Admin changing user password", {
      correlationId,
      adminUserId,
      targetUserId,
    });

    try {
      // For admin changing other user's password, we don't need to verify current password
      await this.userService.changePassword(targetUserId, null, dto.new_password);

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

  @Post(":userId/role")
  @ApiBearerAuth()
  @RequirePermissions("com.lotto.service.auth-internal:user:assign-role")
  @ApiOperation({
    summary: "Assign role to user",
    description: "Allows authorized users to assign a role to a user",
  })
  @ApiParam({
    name: "userId",
    description: "ID of the user to assign the role to",
    type: "string",
  })
  @ApiResponse({
    status: 200,
    description: "Role assigned successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Role assigned successfully",
        },
        status_code: {
          type: "number",
          example: 200,
        },
        data: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            role_id: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            }
          }
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
  @ApiResponse({
    status: 404,
    description: "User or role not found",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "User or role not found",
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
    @Request() req: RequestWithUser,
    @Param("userId") userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    const correlationId = req["correlationId"];
    this.logger.log("Assigning role to user", { correlationId, userId });

    try {
      const result = await this.userService.assignRole(userId, dto.roleId, correlationId);
      
      return {
        message: "Role assigned successfully",
        status_code: 200,
        data: {
          user_id: userId,
          role_id: dto.roleId
        },
        meta: {
          correlation_id: correlationId,
        },
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException({
          message: error.message,
          error: error.name,
          status_code: 403,
          meta: {
            correlation_id: correlationId,
          },
        });
      }

      throw new InternalServerErrorException({
        message: "Error assigning role",
        error: "InternalServerError",
        status_code: 500,
        meta: {
          correlation_id: correlationId,
        },
      });
    }
  }
} 
