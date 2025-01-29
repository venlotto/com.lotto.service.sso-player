import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guard/jwt-auth.guard";
import { UserService } from "../services/user.service";
import { MeResponseDto } from "../dto/me-response.dto";

@ApiTags("User")
@Controller("me")
export class MeController {
  constructor(private readonly userService: UserService) {}

  @Get()
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
  async getMe(@Request() req): Promise<MeResponseDto> {
    return this.userService.getUserDetails(req.user.id);
  }
} 