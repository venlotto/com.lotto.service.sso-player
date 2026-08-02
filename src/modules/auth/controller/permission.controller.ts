import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { CreatePermissionDto } from "../dto/create-permission.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
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
  @RequirePermissions("com.lotto.service.sso-internal:permission:create")
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
          example: "ConflictException",
        },
        correlation_id: {
          type: "string",
          format: "uuid",
        },
      },
    },
  })
  async createPermission(
    @Body() dto: CreatePermissionDto,
    @CorrelationId() correlationId: string | null,
  ): Promise<unknown> {
    this.logger.log("Creating new permission", { correlationId });

    try {
      return await this.permissionService.createPermission(dto, correlationId);
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack, { correlationId });
      throw new InternalServerErrorException({
        message: err.message,
        error: "InternalServerError",
        correlation_id: correlationId,
      });
    }
  }

  @Get()
  @RequirePermissions("com.lotto.service.sso-internal:permission:view")
  @ApiOperation({ summary: "Get all permissions" })
  @ApiResponse({
    status: 200,
    description: "List of all permissions",
    schema: {
      type: "object",
      properties: {
        permissions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
              },
              name: {
                type: "string",
              },
              description: {
                type: "string",
              },
            },
          },
        },
        correlation_id: {
          type: "string",
          format: "uuid",
        },
      },
    },
  })
  async getAllPermissions(
    @CorrelationId() correlationId: string | null,
  ): Promise<unknown> {
    this.logger.log("Getting all permissions", { correlationId });

    try {
      return await this.permissionService.getAllPermissions(correlationId);
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack, { correlationId });
      throw new InternalServerErrorException({
        message: err.message,
        error: "InternalServerError",
        correlation_id: correlationId,
      });
    }
  }
}
