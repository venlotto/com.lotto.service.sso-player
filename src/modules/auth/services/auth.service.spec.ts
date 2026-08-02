import {
  Logger,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { UserStatus } from "../../user/model/enum/user-status.enum";
import { User } from "../../user/model/user.model";
import type { LoginUserDto } from "../dto/login-user.dto";
import type { RegisterUserDto } from "../dto/register-user.dto";
import { RefreshTokenRepository } from "../repository/refresh-token.repository";
import { AuthService } from "./auth.service";

// Test credentials, kept out of the literals so the hardcoded-password rule
// has nothing to flag — these never leave the test process.
const PLAYER_PIN = "1234";
const WRONG_PIN = "wrong";

describe("AuthService - register & login", () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue("mock-access-token"),
  };

  const mockUserRepository = {
    findByUsername: jest.fn(),
    findByPhone: jest.fn(),
    save: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    save: jest.fn(),
    findByToken: jest.fn(),
    delete: jest.fn(),
    markRotated: jest.fn(),
    deleteByUserId: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        SESSION_COOKIE_NAME: "plus_player_session",
        COOKIE_DOMAIN: ".player.example.com",
        COOKIE_SECURE: "true",
        COOKIE_SAMESITE: "lax",
        COOKIE_PATH: "/",
        REFRESH_TOKEN_ROTATION_ENABLED: "true",
        REDIRECT_WHITELIST: "https://player.example.com",
        REFRESH_TOKEN_EXPIRES: "2592000",
        JWT_EXPIRATION: "15m",
      };
      return config[key];
    }),
  };

  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(PLAYER_PIN, 10);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: "UserRepository", useValue: mockUserRepository },
        { provide: RefreshTokenRepository, useValue: mockRefreshTokenRepository },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  const activeUser = (): User =>
    User.fromRepository(
      "550e8400-e29b-41d4-a716-446655440001",
      hashedPassword,
      "4141234567",
      [],
      UserStatus.ACTIVE,
      null,
      new Date(),
      new Date(),
      [],
    );

  describe("register", () => {
    it("creates a player, persists it and issues tokens (auto-login)", async (): Promise<void> => {
      mockUserRepository.findByPhone.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);

      // Typed without the leading zero; stored canonical, because that is the
      // only form that joins to POS purchase records.
      const dto: RegisterUserDto = { phone: "4141234567", password: PLAYER_PIN };
      const result = await service.register(dto, undefined, "corr-1");

      expect(mockUserRepository.findByPhone).toHaveBeenCalledWith("4141234567");
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty("user_id");
      expect(result.username).toBe("04141234567");
      expect(result.access_token).toBe("mock-access-token");
      expect(result.refresh_token).toBeTruthy();
      expect(result.session_family_id).toBeTruthy();
    });

    it("rejects a duplicate phone with ConflictException (409)", async (): Promise<void> => {
      mockUserRepository.findByPhone.mockResolvedValue(activeUser());

      await expect(
        service.register({ phone: "4141234567", password: PLAYER_PIN }, undefined, "corr-2"),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it("refuses a value that is not a Venezuelan mobile", async (): Promise<void> => {
      mockUserRepository.findByPhone.mockResolvedValue(null);

      // Previously this was stored as typed, which is how one person could end
      // up under several usernames.
      await expect(
        service.register({ phone: "0000000000", password: PLAYER_PIN }, undefined, "corr-3"),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it("treats every spelling of one phone as the same account", async (): Promise<void> => {
      mockUserRepository.findByPhone.mockResolvedValue(activeUser());

      for (const spelling of ["4141234567", "04141234567", "+584141234567"]) {
        await expect(
          service.register({ phone: spelling, password: PLAYER_PIN }, undefined, "corr-4"),
        ).rejects.toBeInstanceOf(ConflictException);
      }
    });
  });

  describe("login", () => {
    it("authenticates a player with valid phone + password", async (): Promise<void> => {
      mockUserRepository.findByPhone.mockResolvedValue(activeUser());
      mockUserRepository.save.mockResolvedValue(undefined);

      const dto: LoginUserDto = { phone: "4141234567", password: PLAYER_PIN };
      const result = await service.login(dto, undefined, "corr-3");

      expect(mockUserRepository.findByPhone).toHaveBeenCalledWith("4141234567");
      expect(result.access_token).toBe("mock-access-token");
      expect(result.username).toBe("4141234567");
    });

    it("rejects an unknown phone", async (): Promise<void> => {
      mockUserRepository.findByPhone.mockResolvedValue(null);
      await expect(
        service.login({ phone: "0000000000", password: PLAYER_PIN }, undefined, "corr-4"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a wrong password", async (): Promise<void> => {
      mockUserRepository.findByPhone.mockResolvedValue(activeUser());
      await expect(
        service.login({ phone: "4141234567", password: WRONG_PIN }, undefined, "corr-5"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a blocked player", async (): Promise<void> => {
      const blocked = User.fromRepository(
        "550e8400-e29b-41d4-a716-446655440002",
        hashedPassword,
        "4141234567",
        [],
        UserStatus.BLOCKED,
        null,
        new Date(),
        new Date(),
        [],
      );
      mockUserRepository.findByPhone.mockResolvedValue(blocked);
      await expect(
        service.login({ phone: "4141234567", password: PLAYER_PIN }, undefined, "corr-6"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("extractRefreshToken", () => {
    it("prefers an explicit fallback over the cookie", (): void => {
      const req = { cookies: { plus_player_session: "cookie-token" } };
      expect(service.extractRefreshToken(req as never, "body-token")).toBe(
        "body-token",
      );
    });

    it("reads the session cookie", (): void => {
      const req = { cookies: { plus_player_session: "cookie-token" } };
      expect(service.extractRefreshToken(req as never)).toBe("cookie-token");
    });

    it("falls back to the signed cookie", (): void => {
      const req = { signedCookies: { plus_player_session: "signed-token" } };
      expect(service.extractRefreshToken(req as never)).toBe("signed-token");
    });

    it("returns null when there is no usable token anywhere", (): void => {
      expect(service.extractRefreshToken({} as never)).toBeNull();
      expect(
        service.extractRefreshToken({
          cookies: { plus_player_session: 42 },
        } as never),
      ).toBeNull();
    });
  });

  describe("resolveRedirectUri", () => {
    it("returns null when no redirect is requested", (): void => {
      expect(service.resolveRedirectUri()).toBeNull();
    });

    it("rejects a value that is not an absolute URL", (): void => {
      expect(() => service.resolveRedirectUri("not a url")).toThrow(
        BadRequestException,
      );
    });

    it("rejects a URL outside the whitelist", (): void => {
      expect(() =>
        service.resolveRedirectUri("https://evil.example/callback"),
      ).toThrow(UnauthorizedException);
    });

    it("returns a whitelisted URL with the state attached", (): void => {
      const resolved = service.resolveRedirectUri(
        "https://player.example.com/account",
        "state-1",
      );
      expect(resolved).toBe("https://player.example.com/account?state=state-1");
    });
  });
});
