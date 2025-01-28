import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseGuards,
  Logger,
  InternalServerErrorException,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";

import { AssignPermissionsDto } from "../dto/assign-permissions.dto";
import { CreateRoleDto } from "../dto/create-role.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { RoleService } from "../services/role.service";

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
  async createRole(@Request() req: Request, @Body() dto: CreateRoleDto) {
    const correlationId = req["correlationId"];
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

  @Post(":roleId/permissions")
  @RequirePermissions("com.lotto.service.auth-internal:role:assign-permission")
  @ApiOperation({ summary: "Assign permissions to a role" })
  @ApiResponse({
    status: 200,
    description: "Permissions assigned successfully",
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
    status: 404,
    description: "Role not found",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Role not found",
        },
        error: {
          type: "string",
          example: "Not Found",
        },
        correlation_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  async assignPermissions(
    @Request() req: Request,
    @Param("roleId") roleId: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    const correlationId = req["correlationId"];
    this.logger.log("Assigning permissions to role", { correlationId, roleId });

    try {
      return await this.roleService.assignPermissions(
        roleId,
        dto,
        correlationId,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error assigning permissions",
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
  async getAllRoles(@Request() req: Request) {
    const correlationId = req["correlationId"];
    this.logger.log("Getting all roles", { correlationId });

    try {
      return await this.roleService.getAllRoles(correlationId);
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
    status: 404,
    description: "Role not found",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Role not found",
        },
        error: {
          type: "string",
          example: "Not Found",
        },
        correlation_id: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  async getRole(@Request() req: Request, @Param("roleId") roleId: string) {
    const correlationId = req["correlationId"];
    this.logger.log("Getting role details", { correlationId, roleId });

    try {
      return await this.roleService.getRoleWithPermissions(
        roleId,
        correlationId,
      );
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
