import {
  HttpException,
  Body,
  ConflictException,
  Controller,
  Headers,
  Logger,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

import { CorrelationId } from "../../../decorators/correlation-id.decorator";
import { Public } from "../decorators/public.decorator";
import { LoginUserDto } from "../dto/login-user.dto";
import { LogoutDto } from "../dto/logout.dto";
import { RegisterUserDto } from "../dto/register-user.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthService, RenewSessionResponse } from "../services/auth.service";

interface SessionMetadata {
  token: string;
  expiresAt: Date;
}

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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("login")
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials or inactive user",
  })
  public async login(
    @Body() loginUserDto: LoginUserDto,
    @CorrelationId() correlationId: string | null,
    @Headers("x-client-type") clientType: string | undefined,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<Record<string, unknown> | void> {
    this.logger.log("Login attempt", { correlationId });

    try {
      const login = await this.authService.login(
        loginUserDto,
        this.buildSessionContext(req),
        correlationId,
      );

      this.attachSessionCookie(res, {
        token: login.refresh_token,
        expiresAt: new Date(login.refresh_token_expires_at),
      });

      // Validate redirect_uri if provided (for security), but don't perform redirect
      let validatedRedirectUri: string | undefined;
      if (loginUserDto.redirect_uri) {
        try {
          validatedRedirectUri = this.authService.resolveRedirectUri(
            loginUserDto.redirect_uri,
            loginUserDto.state,
          );
        } catch (error) {
          // If redirect validation fails, log but don't fail the login
          this.logger.warn(
            `Invalid redirect_uri: ${loginUserDto.redirect_uri}`,
            { correlationId },
          );
        }
      }

      // Native/desktop clients (e.g. Tauri) cannot read the HttpOnly cookie
      // cross-origin, so they need the tokens in the response body to bootstrap
      // the body-token refresh flow. Browser clients omit the header and keep
      // relying on the cookie only (no behaviour change).
      const isDesktopClient = clientType?.trim().toLowerCase() === "desktop";

      return {
        user_id: login.user_id,
        username: login.username,
        user: login.user,
        session_family_id: login.session_family_id,
        correlation_id: correlationId,
        redirect_uri: validatedRedirectUri, // Frontend will handle redirect
        ...(isDesktopClient
          ? {
              access_token: login.access_token,
              refresh_token: login.refresh_token,
              refresh_token_expires_at: login.refresh_token_expires_at,
            }
          : {}),
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

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("register")
  @ApiOperation({ summary: "Register a new player and start a session" })
  @ApiResponse({
    status: 201,
    description: "Player registered and logged in",
  })
  @ApiResponse({
    status: 409,
    description: "Username already exists",
  })
  public async register(
    @Body() registerUserDto: RegisterUserDto,
    @CorrelationId() correlationId: string | null,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<Record<string, unknown> | void> {
    this.logger.log("Register attempt", { correlationId });

    try {
      const result = await this.authService.register(
        registerUserDto,
        this.buildSessionContext(req),
        correlationId,
      );

      this.attachSessionCookie(res, {
        token: result.refresh_token,
        expiresAt: new Date(result.refresh_token_expires_at),
      });

      return {
        user_id: result.user_id,
        username: result.username,
        user: result.user,
        session_family_id: result.session_family_id,
        correlation_id: correlationId,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      // Preserve the status the domain chose. Previously only Conflict was
      // re-thrown, so a validation failure — and anything else, including a
      // database outage — was reported to the caller as 401 Unauthorized.
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException({
        message: error.message,
        error: "Unauthorized",
        correlation_id: correlationId,
      });
    }
  }

  @Public()
  @SkipThrottle()
  @Post("session")
  @ApiOperation({ summary: "Renew session using cookie or refresh token" })
  public async session(
    @Body() dto: RefreshTokenDto,
    @CorrelationId() correlationId: string | null,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<Record<string, unknown>> {
    const refreshToken = this.authService.extractRefreshToken(
      req,
      dto.refresh_token,
    );
    if (!refreshToken) {
      throw new UnauthorizedException({
        message: "Refresh token missing",
        error: "Unauthorized",
        correlation_id: correlationId,
      });
    }

    try {
      const renewed = await this.authService.renewSession(
        refreshToken,
        this.buildSessionContext(req),
        correlationId,
      );

      this.attachSessionCookie(res, {
        token: renewed.refresh_token,
        expiresAt: new Date(renewed.refresh_token_expires_at),
      });

      return this.buildRenewResponse(renewed, correlationId);
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      throw error instanceof UnauthorizedException
        ? error
        : new UnauthorizedException({
            message: "Error refreshing session",
            error: "Unauthorized",
            correlation_id: correlationId,
          });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @ApiOperation({ summary: "Logout user" })
  public async logout(
    @Headers("authorization") _authHeader: string,
    @Body() body: LogoutDto,
    @CorrelationId() correlationId: string | null,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<void> {
    try {
      const refreshToken = this.authService.extractRefreshToken(
        req,
        body.refresh_token,
      );
      if (refreshToken) {
        await this.authService.revokeToken(refreshToken);
      }
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      throw error;
    } finally {
      this.authService.clearSessionCookie(res);
    }
  }

  private attachSessionCookie(
    res: ExpressResponse,
    metadata: SessionMetadata,
  ): void {
    this.authService.attachSessionCookie(res, metadata);
  }

  private buildSessionContext(request: ExpressRequest): {
    ip: string | null;
    userAgent: string | null;
  } {
    const userAgentHeader = request.headers["user-agent"];
    const userAgent = Array.isArray(userAgentHeader)
      ? userAgentHeader.join(" ")
      : (userAgentHeader ?? null);

    return {
      ip: request.ip ?? null,
      userAgent,
    };
  }

  private buildRenewResponse(
    renewed: RenewSessionResponse,
    correlationId: string | null,
  ): Record<string, unknown> {
    return {
      user_id: renewed.user.id,
      user: renewed.user,
      username: renewed.user.username,
      access_token: renewed.access_token,
      refresh_token: renewed.refresh_token,
      refresh_token_expires_at: renewed.refresh_token_expires_at,
      session_family_id: renewed.session_family_id,
      correlation_id: correlationId,
    };
  }
}
