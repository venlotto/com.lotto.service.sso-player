import {
  Body,
  Controller,
  Logger,
  Post,
  Request,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { UserService } from "../services/user.service";

@ApiTags("User")
@Controller("v1/users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChangePasswordController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger = new Logger(ChangePasswordController.name),
  ) {}

  @Post("changePassword")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change user password",
    description: "Allows a user to change their password",
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
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    const correlationId = req["correlationId"];
    const userId = req.user.sub;

    this.logger.log("Changing user password", { correlationId, userId });

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
}
