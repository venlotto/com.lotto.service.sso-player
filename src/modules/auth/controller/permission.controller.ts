import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Logger,
  InternalServerErrorException,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";

import { CreatePermissionDto } from "../dto/create-permission.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { PermissionService } from "../services/permission.service";

@ApiTags("Permissions")
@Controller("v1/permissions")
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
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly logger: Logger = new Logger(PermissionController.name),
  ) {}

  @Post()
  @RequirePermissions("com.lotto.service.auth-internal:permission:create")
  @ApiOperation({ summary: "Create a new permission" })
  @ApiResponse({ status: 201, description: "Permission created successfully" })
  @ApiResponse({
    status: 409,
    description: "Permission already exists",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Permission already exists",
        },
        error: {
          type: "string",
          example: "Conflict",
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
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "An unexpected error occurred",
        },
        error: {
          type: "string",
          example: "Internal Server Error",
        },
        correlationId: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  async createPermission(
    @Request() req: Request,
    @Body() dto: CreatePermissionDto,
  ) {
    const correlationId = req["correlationId"];
    this.logger.log("Creating new permission", { correlationId });

    try {
      return await this.permissionService.createPermission(dto, correlationId);
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error creating permission",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }

  @Get()
  @RequirePermissions("com.lotto.service.auth-internal:permission:view")
  @ApiOperation({ summary: "Get all permissions with their assigned roles" })
  @ApiResponse({
    status: 200,
    description: "List of all permissions with roles",
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
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "An unexpected error occurred",
        },
        error: {
          type: "string",
          example: "Internal Server Error",
        },
        correlation_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  async getAllPermissions(@Request() req: Request) {
    const correlationId = req["correlationId"];
    this.logger.log("Getting all permissions", { correlationId });

    try {
      return await this.permissionService.getAllPermissions(correlationId);
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error retrieving permissions",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }
}
