import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Logger,
  InternalServerErrorException,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";

import { CreateRoleDto } from "../dto/create-role.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { RoleService } from "../services/role.service";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";

@ApiTags("Roles")
@Controller("v1/roles")
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
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly logger: Logger = new Logger(RoleController.name),
  ) {}

  @Post()
  @RequirePermissions("com.lotto.service.auth-internal:role:create")
  @ApiOperation({ summary: "Create a new role" })
  @ApiResponse({
    status: 201,
    description: "Role created successfully",
    schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
        name: {
          type: "string",
          example: "admin",
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Role already exists",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Role already exists",
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
        statusCode: {
          type: "number",
          example: 500,
        },
        correlationId: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  async createRole(
    @Request() req: Request,
    @Body() dto: CreateRoleDto,
    @CorrelationId() correlationId: string | null,
  ) {
    this.logger.log("Creating new role", { correlationId });

    try {
      return await this.roleService.createRole(dto, correlationId);
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error creating role",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }

  @Get()
  @RequirePermissions("com.lotto.service.auth-internal:role:view")
  @ApiOperation({ summary: "Get all roles with their permissions" })
  @ApiResponse({
    status: 200,
    description: "List of all roles with permissions",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Success",
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
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                example: "123e4567-e89b-12d3-a456-426614174000",
              },
              name: {
                type: "string",
                example: "User Management",
              },
              description: {
                type: "string",
                example: "User and role management",
              },
              created_at: {
                type: "string",
                format: "date-time",
              },
              updated_at: {
                type: "string",
                format: "date-time",
              },
              permissions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    permission_id: {
                      type: "string",
                      example: "123e4567-e89b-12d3-a456-426614174000",
                    },
                    name: {
                      type: "string",
                      example: "com.lotto.service.auth-internal:user:create",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "User does not have required permissions",
  })
  async getAllRoles(
    @Request() req: Request,
    @CorrelationId() correlationId: string | null,
  ) {
    this.logger.log("Getting all roles", { correlationId });

    try {
      const roles = await this.roleService.getAllRoles(correlationId);
      return {
        message: "Success",
        status_code: 200,
        meta: {
          correlation_id: correlationId,
        },
        data: roles,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error retrieving roles",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }

  @Get(":roleId")
  @RequirePermissions("com.lotto.service.auth-internal:role:view")
  @ApiOperation({ summary: "Get role details with permissions" })
  @ApiResponse({
    status: 200,
    description: "Role details retrieved successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Success",
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
        data: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            name: {
              type: "string",
              example: "User Management",
            },
            description: {
              type: "string",
              example: "User and role management",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
            permissions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  permission_id: {
                    type: "string",
                    example: "123e4567-e89b-12d3-a456-426614174000",
                  },
                  name: {
                    type: "string",
                    example: "com.lotto.service.auth-internal:user:create",
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "User does not have required permissions",
  })
  @ApiResponse({
    status: 404,
    description: "Role not found",
  })
  async getRole(
    @Request() req: Request,
    @Param("roleId") roleId: string,
    @CorrelationId() correlationId: string | null,
  ) {
    this.logger.log("Getting role by ID", { correlationId, roleId });

    try {
      const role = await this.roleService.getRoleWithPermissions(roleId, correlationId);
      return {
        message: "Success",
        status_code: 200,
        meta: {
          correlation_id: correlationId,
        },
        data: role,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error retrieving role",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }
}
