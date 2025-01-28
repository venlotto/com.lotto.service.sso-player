import {
  Body,
  ConflictException,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiHeader } from "@nestjs/swagger";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { Public } from "../../auth/decorators/public.decorator";
import { AuthService } from "../../auth/services/auth.service";
import { NewUserDto } from "../dto/new-user.dto";
import { User } from "../model/user.model";
import { UserService } from "../services/user.service";

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
export class NewUserController {
  public constructor(
    private readonly userService: UserService,
    private readonly logger: Logger = new Logger(NewUserController.name),
  ) {}

  @ApiOperation({
    summary: "Register a new user",
    description: "Creates a new user account and returns authentication tokens",
  })
  @ApiResponse({
    status: 201,
    description: "User successfully created",
    schema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "The unique identifier of the created user",
          example: "5a0f6d41-5afc-4519-acb2-686246829451",
        },
        username: {
          type: "string",
          description: "The username of the created user",
          example: "testuser",
        },
        access_token: {
          type: "string",
          description: "JWT token for authentication",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
        refresh_token: {
          type: "string",
          description: "Token for refreshing the access token",
          example: "1d30e30b73647462cb134e37bac4c8aa...",
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Username already exists",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Username already exists",
        },
        error: {
          type: "string",
          example: "ConflictException",
        },
        statusCode: {
          type: "number",
          example: 409,
        },
        correlationId: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
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
    status: 500,
    description: "Internal Server Error",
  })
  @RequirePermissions("com.lotto.service.auth-internal:user:create")
  @Post("newUser")
  public async new(
    @Req() req: Request,
    @Body() newUserDto: NewUserDto,
  ): Promise<any> {
    const correlationId = req["correlationId"];
    this.logger.log(`Creating new user`, { correlationId });

    try {
      const user = await this.userService.createUser(
        newUserDto.username,
        newUserDto.password,
        correlationId,
      );
      const userPayload = User.toPayload(user);

      return {
        user_id: user.id,
        username: user.username,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException({
          message: error.message,
          error: error.name,
          statusCode: error.getStatus(),
          correlationId,
        });
      }

      this.logger.error(error.message, error.stack, { correlationId });
      throw new InternalServerErrorException({
        message: "An unexpected error occurred",
        error: "InternalServerError",
        statusCode: 500,
        correlationId,
      });
    }
  }
}
