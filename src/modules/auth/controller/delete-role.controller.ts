import {
  Controller,
  Delete,
  Body,
  UseGuards,
  Logger,
  InternalServerErrorException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { DeleteRoleDto } from "../dto/delete-role.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
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
export class DeleteRoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly logger: Logger = new Logger(DeleteRoleController.name),
  ) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("com.lotto.service.sso-internal:role:delete")
  @ApiOperation({ summary: "Delete a role" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Role successfully deleted",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Role not found",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      "Cannot delete role that has permissions assigned or is assigned to users",
  })
  async deleteRole(
    @Body() dto: DeleteRoleDto,
    @CorrelationId() correlationId: string,
  ): Promise<void> {
    try {
      await this.roleService.deleteRole(dto.role_id, correlationId);
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException({
          message: "Error deleting role",
          error: "Internal Server Error",
          correlation_id: correlationId,
        });
      }
      throw error;
    }
  }
}
