import {
  Body,
  ConflictException,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiHeader } from "@nestjs/swagger";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { NewUserDto } from "../dto/new-user.dto";
import { UserService } from "../services/user.service";

interface NewUserResponse {
  message: string;
  status_code: number;
  data: {
    user_id: string;
    username: string | null;
  };
  meta: {
    correlation_id: string | null;
  };
}

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
        message: {
          type: "string",
          example: "User created successfully",
        },
        status_code: {
          type: "number",
          example: 201,
        },
        data: {
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
          },
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
        status_code: {
          type: "number",
          example: 409,
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
    status: 500,
    description: "Internal Server Error",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "An unexpected error occurred",
        },
        error: {
          type: "string",
          example: "InternalServerError",
        },
        status_code: {
          type: "number",
          example: 500,
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
  @RequirePermissions("com.lotto.service.sso-internal:user:create")
  @Post("newUser")
  public async new(
    @Body() newUserDto: NewUserDto,
    @CorrelationId() correlationId: string | null,
  ): Promise<NewUserResponse> {
    this.logger.log(`Creating new user`, { correlationId });

    try {
      const user = await this.userService.createUser(
        newUserDto.username,
        newUserDto.password,
        correlationId,
      );

      return {
        message: "User created successfully",
        status_code: 201,
        data: {
          user_id: user.id,
          username: user.username,
        },
        meta: {
          correlation_id: correlationId,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException({
          message: "Username already exists",
          error: "ConflictException",
          status_code: 409,
          meta: {
            correlation_id: correlationId,
          },
        });
      }

      this.logger.error(error.message, error.stack, { correlationId });
      throw new InternalServerErrorException({
        message: "An unexpected error occurred",
        error: "InternalServerError",
        status_code: 500,
        meta: {
          correlation_id: correlationId,
        },
      });
    }
  }
}
