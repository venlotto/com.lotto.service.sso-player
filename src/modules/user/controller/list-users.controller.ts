import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  InternalServerErrorException,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from "@nestjs/swagger";

import { CorrelationId } from "../../../decorators/correlation-id.decorator";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { ListUsersQueryDto } from "../dto/list-users-query.dto";
import { ListUsersResponseDto } from "../dto/list-users-response.dto";
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
export class ListUsersController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger = new Logger(ListUsersController.name),
  ) {}

  @Get()
  @ApiBearerAuth()
  @RequirePermissions("com.lotto.service.sso-internal:user:list")
  @ApiOperation({
    summary: "List all users",
    description:
      "Returns a paginated list of users with their roles and permissions",
  })
  @ApiResponse({
    status: 200,
    description: "Users retrieved successfully",
    type: ListUsersResponseDto,
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
  async listUsers(
    @Request() req: Request,
    @Query() query: ListUsersQueryDto,
    @CorrelationId() correlationId: string | null,
  ): Promise<ListUsersResponseDto> {
    this.logger.log("Listing users", { correlationId, query });

    try {
      return await this.userService.listUsers(
        query.page,
        query.limit,
        correlationId,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      throw new InternalServerErrorException({
        message: "Error retrieving users",
        error: "Internal Server Error",
        correlation_id: correlationId,
      });
    }
  }
}
