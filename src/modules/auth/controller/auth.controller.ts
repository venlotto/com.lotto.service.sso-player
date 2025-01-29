import {
  Body,
  Controller,
  Logger,
  Post,
  UnauthorizedException,
  Headers,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { UUID } from "../../../common/value-object/uuid.value-object";
import { Public } from "../decorators/public.decorator";
import { LoginUserDto } from "../dto/login-user.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { AuthService } from "../services/auth.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { LogoutDto } from "../dto/logout.dto";
import { CorrelationId } from "../../../decorators/correlation-id.decorator";

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
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
    schema: {
      type: "object",
      properties: {
        user_id: { type: "string", format: "uuid" },
        access_token: { type: "string" },
        refresh_token: { type: "string" },
        correlation_id: { type: "string", format: "uuid" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials or inactive user",
    schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        error: { type: "string" },
        correlation_id: { type: "string", format: "uuid" },
      },
    },
  })
  public async login(
    @Body() loginUserDto: LoginUserDto,
    @CorrelationId() correlationId: string | null,
  ): Promise<any> {
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

  @Post("refreshToken")
  @ApiOperation({ summary: "Refresh access token" })
  public async refresh(
    @Body() dto: RefreshTokenDto,
    @CorrelationId() correlationId: string | null,
  ): Promise<any> {
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
        await this.authService.revokeToken(refreshToken.token);
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

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @ApiOperation({ summary: "Logout user" })
  public async logout(
    @Headers("authorization") authHeader: string,
    @Body() body: LogoutDto,
    @CorrelationId() correlationId: string | null,
  ): Promise<void> {
    try {
      const refreshToken = await this.authService.findRefreshToken(body.refresh_token);
      if (refreshToken) {
        await this.authService.revokeToken(refreshToken.token);
      }
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      throw error;
    }
  }
}
