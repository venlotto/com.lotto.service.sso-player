import {
  Body,
  Controller,
  Logger,
  Post,
  UnauthorizedException,
  Req,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiHeader } from "@nestjs/swagger";

import { UUID } from "../../../common/value-object/uuid.value-object";
import { Public } from "../decorators/public.decorator";
import { LoginUserDto } from "../dto/login-user.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { AuthService } from "../services/auth.service";

@ApiTags("Auth")
@Controller("v1/auth")
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
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    private readonly logger: Logger = new Logger(AuthController.name),
  ) {}

  @Public()
  @Post("login")
  public async login(
    @Req() req: Request,
    @Body() loginUserDto: LoginUserDto,
  ): Promise<any> {
    const correlationId = req["correlationId"];
    this.logger.log("Login attempt", { correlationId });

    try {
      const login = await this.authService.login(loginUserDto);

      return {
        user_id: login.user_id,
        access_token: login.access_token,
        refresh_token: login.refresh_token,
        correlation_id: correlationId,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      throw new UnauthorizedException({
        message: error.message,
        error: "Unauthorized",
        correlation_id: correlationId,
      });
    }
  }

  @Post("refresh-token")
  public async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
  ): Promise<any> {
    const correlationId = req["correlationId"];
    this.logger.log("Refreshing token", { correlationId });

    try {
      const refreshToken = await this.authService.findRefreshToken(
        dto.refresh_token,
      );

      if (!refreshToken) {
        throw new UnauthorizedException({
          message: "Invalid refresh token",
          error: "Unauthorized",
          correlation_id: correlationId,
        });
      }

      const currentTime = new Date().getTime();
      const expiresAt = new Date(refreshToken.expires_at).getTime();
      if (expiresAt < currentTime) {
        await this.authService.revokeRefreshToken(refreshToken.token);
        throw new UnauthorizedException({
          message: "Refresh token expired",
          error: "Unauthorized",
          correlation_id: correlationId,
        });
      }

      // Generate new access token
      const refresh = await this.authService.refreshToken(
        new UUID(refreshToken.user_id),
      );

      return {
        user_id: refreshToken.user_id,
        access_token: refresh.access_token,
        refresh_token: refresh.refresh_token,
        correlation_id: correlationId,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException({
        message: "Error refreshing token",
        error: "Unauthorized",
        correlation_id: correlationId,
      });
    }
  }
}
