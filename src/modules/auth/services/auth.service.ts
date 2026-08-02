import * as crypto from "crypto";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { CookieOptions, Request, Response } from "express";
import { normalizeVePhone } from "../../../utils/phone";
import { UserStatus } from "../../user/model/enum/user-status.enum";
import { User } from "../../user/model/user.model";
import { IUserRepository } from "../../user/repository/user.repository.interface";
import { LoginUserDto } from "../dto/login-user.dto";
import { RegisterUserDto } from "../dto/register-user.dto";
import { RefreshToken } from "../model/refresh-token.model";
import { RefreshTokenRepository } from "../repository/refresh-token.repository";

interface TokenPayload {
  sub: string;
  username: string;
  roles: string[];
  permissions: string[];
  [key: string]: unknown;
}

interface SessionContext {
  ip?: string | null;
  userAgent?: string | null;
}

interface GeneratedRefreshToken {
  token: string;
  tokenId: string;
  familyId: string;
  expiresAt: Date;
}

interface RefreshTokenOptions {
  familyId?: string;
  context?: SessionContext;
}

export interface UserSummary {
  id: string;
  username: string | null;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  user_id: string;
  username: string | null;
  user: UserSummary;
  access_token: string;
  refresh_token: string;
  refresh_token_expires_at: string;
  session_family_id: string;
}

export interface RenewSessionResponse {
  user: UserSummary;
  username: string | null;
  access_token: string;
  refresh_token: string;
  refresh_token_expires_at: string;
  session_family_id: string;
}

@Injectable()
export class AuthService {
  private readonly sessionCookieName: string;
  private readonly cookieDomain: string | undefined;
  private readonly cookieSecure: boolean;
  private readonly cookieSameSite: "lax" | "strict" | "none";
  private readonly cookiePath: string;
  private readonly rotateRefreshTokens: boolean;
  private readonly redirectWhitelist: string[];

  public constructor(
    private readonly jwtService: JwtService,
    @Inject("UserRepository") private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.sessionCookieName = (
      this.configService.get<string>("SESSION_COOKIE_NAME") ??
      "plus_player_session"
    ).trim();
    this.cookieDomain =
      this.configService.get<string>("COOKIE_DOMAIN") ?? undefined;
    this.cookieSecure = this.toBoolean(
      this.configService.get<string>("COOKIE_SECURE") ?? "true",
    );
    this.cookieSameSite = this.normaliseSameSite(
      this.configService.get<string>("COOKIE_SAMESITE") ?? "lax",
    );
    this.cookiePath = this.configService.get<string>("COOKIE_PATH") ?? "/";
    this.rotateRefreshTokens = this.toBoolean(
      this.configService.get<string>("REFRESH_TOKEN_ROTATION_ENABLED") ??
        "true",
    );
    this.redirectWhitelist = (
      this.configService.get<string>("REDIRECT_WHITELIST") ?? ""
    )
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  public async validateUser(
    username: string,
    password: string,
    correlationId?: string | null,
  ): Promise<User> {
    this.logger.log("AuthService::validateUser", { username, correlationId });

    const user = await this.userRepository.findByPhone(username);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("User is not active");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return user;
  }

  public async login(
    loginUserDto: LoginUserDto,
    context?: SessionContext,
    correlationId?: string | null,
  ): Promise<LoginResponse> {
    this.logger.log("AuthService::login", {
      phone: loginUserDto.phone,
      correlationId,
    });

    // Accepts any spelling the player types; resolves the canonical row.
    const user = await this.userRepository.findByPhone(loginUserDto.phone);

    if (!user) {
      throw new UnauthorizedException("Invalid login credentials");
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException("User is not active");
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid login credentials");
    }

    user.updateLastLogin();
    await this.userRepository.save(user);

    const { accessToken, refresh } = await this.issueTokens(user, context);

    return {
      user_id: user.id,
      username: user.username,
      user: this.buildUserSummary(user),
      access_token: accessToken,
      refresh_token: refresh.token,
      refresh_token_expires_at: refresh.expiresAt.toISOString(),
      session_family_id: refresh.familyId,
    };
  }

  public async register(
    registerUserDto: RegisterUserDto,
    context?: SessionContext,
    correlationId?: string | null,
  ): Promise<LoginResponse> {
    this.logger.log("AuthService::register", {
      phone: registerUserDto.phone,
      correlationId,
    });

    // Check every spelling, or the same person could register twice under
    // 4120000001 and 04120000001.
    const existing = await this.userRepository.findByPhone(
      registerUserDto.phone,
    );
    if (existing) {
      throw new ConflictException({
        message: "Phone already exists",
        error: "ConflictException",
        status_code: 409,
        meta: { correlation_id: correlationId ?? null },
      });
    }

    // A player's username IS their phone in canonical 0-prefixed form — that
    // is the only key that joins to POS purchase records. Anything else is
    // refused outright rather than stored as typed, which is what previously
    // let one person exist under several spellings.
    const canonicalPhone = normalizeVePhone(registerUserDto.phone);
    if (canonicalPhone === null) {
      throw new BadRequestException({
        message: "phone must be a valid Venezuelan mobile number",
        error: "BadRequestException",
        status_code: 400,
        meta: { correlation_id: correlationId ?? null },
      });
    }

    const user = await User.newUser(registerUserDto.password, canonicalPhone);
    await this.userRepository.save(user);

    const { accessToken, refresh } = await this.issueTokens(user, context);

    return {
      user_id: user.id,
      username: user.username,
      user: this.buildUserSummary(user),
      access_token: accessToken,
      refresh_token: refresh.token,
      refresh_token_expires_at: refresh.expiresAt.toISOString(),
      session_family_id: refresh.familyId,
    };
  }

  public async renewSession(
    refreshTokenValue: string,
    context?: SessionContext,
    correlationId?: string | null,
  ): Promise<RenewSessionResponse> {
    this.logger.log("AuthService::renewSession", { correlationId });

    const storedToken = await this.findRefreshToken(refreshTokenValue);

    if (!storedToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (storedToken.revoked_at) {
      throw new UnauthorizedException("Refresh token revoked");
    }

    if (storedToken.rotated_at) {
      throw new UnauthorizedException("Refresh token already rotated");
    }

    if (storedToken.isExpired()) {
      await this.refreshTokenRepository.delete(storedToken.token);
      throw new UnauthorizedException("Refresh token expired");
    }

    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      await this.refreshTokenRepository.delete(storedToken.token);
      throw new UnauthorizedException("User not found");
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException("User is not active");
    }

    const { accessToken, refresh } = await this.issueTokens(user, context, {
      familyId: storedToken.familyId,
    });

    if (this.rotateRefreshTokens) {
      await this.refreshTokenRepository.markRotated(
        storedToken.tokenId,
        refresh.tokenId,
      );
      await this.refreshTokenRepository.delete(storedToken.token);
    }

    return {
      user: this.buildUserSummary(user),
      username: user.username,
      access_token: accessToken,
      refresh_token: refresh.token,
      refresh_token_expires_at: refresh.expiresAt.toISOString(),
      session_family_id: refresh.familyId,
    };
  }

  public generateAccessToken(payload: TokenPayload): Promise<string> {
    const expiration = this.configService.get<string>("JWT_EXPIRATION") ?? "5m";
    return this.jwtService.signAsync(payload, { expiresIn: expiration });
  }

  public async generateRefreshToken(
    payload: TokenPayload,
    options?: RefreshTokenOptions,
  ): Promise<GeneratedRefreshToken> {
    const tokenValue = crypto.randomUUID();
    const refreshToken = new RefreshToken({
      token: tokenValue,
      userId: payload.sub,
      expiresAt: this.buildRefreshTokenExpiration(),
      familyId: options?.familyId,
      createdByIp: options?.context?.ip ?? null,
      createdByUserAgent: options?.context?.userAgent ?? null,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return {
      token: refreshToken.token,
      tokenId: refreshToken.tokenId,
      familyId: refreshToken.familyId,
      expiresAt: refreshToken.expires_at,
    };
  }

  public async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findByToken(token);
  }

  public async revokeToken(token: string): Promise<void> {
    await this.refreshTokenRepository.delete(token);
  }

  public attachSessionCookie(
    response: Response,
    refresh: GeneratedRefreshToken | { token: string; expiresAt: Date },
  ): void {
    const options = this.buildCookieOptions(refresh.expiresAt);
    response.cookie(this.sessionCookieName, refresh.token, options);
  }

  public clearSessionCookie(response: Response): void {
    const options = this.buildCookieOptions(new Date(0));
    options.maxAge = 0;
    response.cookie(this.sessionCookieName, "", options);
  }

  public extractRefreshToken(
    request: Request,
    fallback?: string | null,
  ): string | null {
    if (fallback !== null && fallback !== undefined && fallback.length > 0) {
      return fallback;
    }

    const requestWithCookies = request as unknown as {
      cookies?: unknown;
      signedCookies?: unknown;
    };

    return (
      this.readCookieValue(requestWithCookies.cookies) ??
      this.readCookieValue(requestWithCookies.signedCookies)
    );
  }

  private readCookieValue(source: unknown): string | null {
    if (typeof source !== "object" || source === null) {
      return null;
    }
    const value = (source as Record<string, unknown>)[this.sessionCookieName];
    return typeof value === "string" ? value : null;
  }

  public resolveRedirectUri(
    redirectUri?: string,
    state?: string,
  ): string | null {
    if (redirectUri === undefined || redirectUri === "") {
      return null;
    }

    let parsed: URL;
    try {
      parsed = new URL(redirectUri);
    } catch (error) {
      throw new BadRequestException(
        "redirect_uri must be a valid absolute URL",
        { cause: error },
      );
    }

    if (!this.isRedirectAllowed(parsed)) {
      throw new UnauthorizedException("redirect_uri is not allowed");
    }

    if (state !== undefined && state !== "") {
      parsed.searchParams.set("state", state);
    }

    return parsed.toString();
  }

  public getSessionCookieName(): string {
    return this.sessionCookieName;
  }

  private async issueTokens(
    user: User,
    context?: SessionContext,
    options?: { familyId?: string },
  ): Promise<{ accessToken: string; refresh: GeneratedRefreshToken }> {
    const payload = User.toPayload(user);
    const accessToken = await this.generateAccessToken(payload);
    const refresh = await this.generateRefreshToken(payload, {
      context,
      familyId: options?.familyId,
    });

    return { accessToken, refresh };
  }

  private buildUserSummary(user: User): UserSummary {
    return {
      id: user.id,
      username: user.username,
      roles: user.roleNames,
      permissions: user.permissions,
    };
  }

  private buildRefreshTokenExpiration(): Date {
    const ttlSecondsValue = this.configService.get<string>(
      "REFRESH_TOKEN_TTL_SECONDS",
    );
    if (ttlSecondsValue !== undefined && ttlSecondsValue !== "") {
      const seconds = Number(ttlSecondsValue);
      if (!Number.isNaN(seconds) && seconds > 0) {
        return new Date(Date.now() + seconds * 1000);
      }
    }

    const ttlDaysValue = this.configService.get<string>(
      "REFRESH_TOKEN_TTL_DAYS",
    );
    const days = Number(ttlDaysValue ?? "30");
    const safeDays = Number.isNaN(days) || days <= 0 ? 30 : days;
    return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
  }

  private buildCookieOptions(expires: Date): CookieOptions {
    return {
      httpOnly: true,
      secure: this.cookieSameSite === "none" ? true : this.cookieSecure,
      sameSite: this.cookieSameSite,
      domain: this.cookieDomain,
      path: this.cookiePath,
      expires,
    };
  }

  private toBoolean(value: string): boolean {
    return value.toLowerCase() !== "false";
  }

  private normaliseSameSite(value: string): "lax" | "strict" | "none" {
    const candidate = value.toLowerCase();
    if (candidate === "strict" || candidate === "none") {
      return candidate;
    }
    return "lax";
  }

  private isRedirectAllowed(target: URL): boolean {
    if (this.redirectWhitelist.length === 0) {
      return false;
    }

    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return false;
    }

    const candidate = `${target.protocol}//${target.host}${target.pathname}`;

    return this.redirectWhitelist.some((allowed) => {
      if (!allowed.startsWith("http://") && !allowed.startsWith("https://")) {
        this.logger.warn(
          `redirect whitelist entry ignored because it is not absolute: ${allowed}`,
        );
        return false;
      }

      const normalized = allowed.endsWith("/") ? allowed : `${allowed}/`;
      const candidateWithSlash = candidate.endsWith("/")
        ? candidate
        : `${candidate}/`;

      return (
        candidate.startsWith(allowed) ||
        candidate.startsWith(normalized) ||
        candidateWithSlash.startsWith(normalized)
      );
    });
  }
}
