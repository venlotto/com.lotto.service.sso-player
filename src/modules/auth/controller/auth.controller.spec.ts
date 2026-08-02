import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Logger } from "@nestjs/common";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import type { LoginUserDto } from "../dto/login-user.dto";
import type { LogoutDto } from "../dto/logout.dto";
import type { RefreshTokenDto } from "../dto/refresh-token.dto";
import type { RegisterUserDto } from "../dto/register-user.dto";
import type { AuthService, LoginResponse } from "../services/auth.service";
import { AuthController } from "./auth.controller";

const PLAYER_PIN = "1234";

const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
  renewSession: jest.fn(),
  revokeToken: jest.fn(),
  resolveRedirectUri: jest.fn(),
  extractRefreshToken: jest.fn(),
  attachSessionCookie: jest.fn(),
  clearSessionCookie: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const controller = (): AuthController =>
  new AuthController(
    mockAuthService as unknown as AuthService,
    mockLogger as unknown as Logger,
  );

const req = (headers: Record<string, string> = {}): ExpressRequest =>
  ({ headers }) as unknown as ExpressRequest;

const res = (): ExpressResponse => ({}) as unknown as ExpressResponse;

const loginResult = (): LoginResponse => ({
  user_id: "user-1",
  username: "04141234567",
  user: { id: "user-1", username: "04141234567", roles: [], permissions: [] },
  access_token: "access-token",
  refresh_token: "refresh-token",
  refresh_token_expires_at: "2026-08-09T00:00:00.000Z",
  session_family_id: "family-1",
});

describe("AuthController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    const dto: RegisterUserDto = { phone: "4141234567", password: PLAYER_PIN };

    it("attaches the session cookie and returns the session summary", async (): Promise<void> => {
      mockAuthService.register.mockResolvedValue(loginResult());

      const result = await controller().register(dto, "corr-1", req(), res());

      expect(mockAuthService.attachSessionCookie).toHaveBeenCalledWith(
        expect.anything(),
        {
          token: "refresh-token",
          expiresAt: new Date("2026-08-09T00:00:00.000Z"),
        },
      );
      expect(result).toMatchObject({
        user_id: "user-1",
        username: "04141234567",
        session_family_id: "family-1",
        correlation_id: "corr-1",
      });
    });

    it("re-throws the domain ConflictException instead of masking it as 401", async (): Promise<void> => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException("Phone already exists"),
      );

      await expect(
        controller().register(dto, "corr-2", req(), res()),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("re-throws a domain BadRequestException (invalid phone) as-is", async (): Promise<void> => {
      mockAuthService.register.mockRejectedValue(
        new BadRequestException("phone must be a valid Venezuelan mobile number"),
      );

      await expect(
        controller().register(dto, "corr-3", req(), res()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("maps an unexpected failure to 401", async (): Promise<void> => {
      mockAuthService.register.mockRejectedValue(new Error("database down"));

      await expect(
        controller().register(dto, "corr-4", req(), res()),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("login", () => {
    const dto: LoginUserDto = { phone: "4141234567", password: PLAYER_PIN };

    it("returns tokens in the body for desktop clients only", async (): Promise<void> => {
      mockAuthService.login.mockResolvedValue(loginResult());

      const browser = (await controller().login(
        dto,
        "corr-1",
        undefined,
        req(),
        res(),
      )) as Record<string, unknown>;
      expect(browser).not.toHaveProperty("access_token");

      const desktop = (await controller().login(
        dto,
        "corr-1",
        "desktop",
        req(),
        res(),
      )) as Record<string, unknown>;
      expect(desktop).toMatchObject({
        access_token: "access-token",
        refresh_token: "refresh-token",
      });
    });

    it("validates redirect_uri but does not fail the login when it is rejected", async (): Promise<void> => {
      mockAuthService.login.mockResolvedValue(loginResult());
      mockAuthService.resolveRedirectUri.mockImplementation(() => {
        throw new BadRequestException("redirect_uri must be a valid absolute URL");
      });

      const result = (await controller().login(
        { ...dto, redirect_uri: "https://evil.example" },
        "corr-2",
        undefined,
        req(),
        res(),
      )) as Record<string, unknown>;

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(result).toMatchObject({ user_id: "user-1" });
      expect(result.redirect_uri).toBeUndefined();
    });

    it("maps an authentication failure to 401", async (): Promise<void> => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException("Invalid login credentials"),
      );

      await expect(
        controller().login(dto, "corr-3", undefined, req(), res()),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("session", () => {
    const dto: RefreshTokenDto = { refresh_token: "refresh-token" };

    it("rejects when no refresh token can be extracted", async (): Promise<void> => {
      mockAuthService.extractRefreshToken.mockReturnValue(null);

      await expect(
        controller().session(dto, "corr-1", req(), res()),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("renews the session and re-attaches the cookie", async (): Promise<void> => {
      mockAuthService.extractRefreshToken.mockReturnValue("refresh-token");
      mockAuthService.renewSession.mockResolvedValue({
        user: { id: "user-1", username: "04141234567", roles: [], permissions: [] },
        username: "04141234567",
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        refresh_token_expires_at: "2026-08-09T00:00:00.000Z",
        session_family_id: "family-1",
      });

      const result = await controller().session(dto, "corr-2", req(), res());

      expect(mockAuthService.renewSession).toHaveBeenCalledWith(
        "refresh-token",
        expect.anything(),
        "corr-2",
      );
      expect(result).toMatchObject({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        correlation_id: "corr-2",
      });
    });

    it("wraps an unexpected renewal failure as 401", async (): Promise<void> => {
      mockAuthService.extractRefreshToken.mockReturnValue("refresh-token");
      mockAuthService.renewSession.mockRejectedValue(new Error("store down"));

      await expect(
        controller().session(dto, "corr-3", req(), res()),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("logout", () => {
    it("revokes the extracted refresh token and always clears the cookie", async (): Promise<void> => {
      mockAuthService.extractRefreshToken.mockReturnValue("refresh-token");

      await controller().logout(
        "Bearer token",
        {} as LogoutDto,
        "corr-1",
        req(),
        res(),
      );

      expect(mockAuthService.revokeToken).toHaveBeenCalledWith("refresh-token");
      expect(mockAuthService.clearSessionCookie).toHaveBeenCalled();
    });

    it("clears the cookie even when revocation fails", async (): Promise<void> => {
      mockAuthService.extractRefreshToken.mockReturnValue("refresh-token");
      mockAuthService.revokeToken.mockRejectedValue(new Error("store down"));

      await expect(
        controller().logout("Bearer token", {} as LogoutDto, "corr-2", req(), res()),
      ).rejects.toBeInstanceOf(Error);
      expect(mockAuthService.clearSessionCookie).toHaveBeenCalled();
    });
  });
});
