import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  InternalServerErrorException,
  Request,
  Delete,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";

import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { PermissionService } from "../services/permission.service";
import { DeletePermissionsDto } from "../dto/delete-permissions.dto";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";

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
export class DeletePermissionsController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly logger: Logger = new Logger(DeletePermissionsController.name),
  ) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("permission:delete")
  @ApiOperation({ summary: "Delete a permission" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Permission successfully deleted",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Permission not found",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Cannot delete permission that is assigned to a role",
  })
  async deletePermissions(
    @Body() dto: DeletePermissionsDto,
    @CorrelationId() correlationId: string,
  ): Promise<void> {
    await this.permissionService.deletePermissions(
      dto.permission_id,
      correlationId,
    );
  }
} 
