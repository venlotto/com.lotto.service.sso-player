import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request as ExpressRequest } from "express";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { MeResponseDto } from "../dto/me-response.dto";
import { UserService } from "../services/user.service";

interface MeRequest extends ExpressRequest {
  user: {
    sub: string;
  };
}

@ApiTags("User")
@Controller("v1/users")
export class MeController {
  constructor(private readonly userService: UserService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user information" })
  @ApiResponse({
    status: 200,
    description: "Returns the current user's information",
    type: MeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async getMe(
    @Request() req: MeRequest,
    @CorrelationId() correlationId: string | null,
  ): Promise<MeResponseDto> {
    return this.userService.getUserDetails(req.user.sub, correlationId);
  }
}
