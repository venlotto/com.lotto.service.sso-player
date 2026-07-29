import { Logger, ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import * as bcrypt from "bcrypt";

import { AuthService } from "./auth.service";
import { RefreshTokenRepository } from "../repository/refresh-token.repository";
import { User } from "../../user/model/user.model";
import { UserStatus } from "../../user/model/enum/user-status.enum";
import type { LoginUserDto } from "../dto/login-user.dto";
import type { RegisterUserDto } from "../dto/register-user.dto";

describe("AuthService - register & login", () => {
  let service: AuthService;

  const mockJwtService = { sign: jest.fn().mockReturnValue("mock-access-token") };

  const mockUserRepository = {
    findByUsername: jest.fn(),
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
        COOKIE_DOMAIN: ".dev1.koperca.com",
        COOKIE_SECURE: "true",
        COOKIE_SAMESITE: "lax",
        COOKIE_PATH: "/",
        REFRESH_TOKEN_ROTATION_ENABLED: "true",
        REDIRECT_WHITELIST: "https://dev1.koperca.com",
        REFRESH_TOKEN_EXPIRES: "2592000",
        JWT_EXPIRATION: "15m",
      };
      return config[key];
    }),
  };

  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash("1234", 10);
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
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);

      const dto: RegisterUserDto = { phone: "4141234567", password: "1234" };
      const result = await service.register(dto, undefined, "corr-1");

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("4141234567");
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty("user_id");
      expect(result.username).toBe("4141234567");
      expect(result.access_token).toBe("mock-access-token");
      expect(result.refresh_token).toBeTruthy();
      expect(result.session_family_id).toBeTruthy();
    });

    it("rejects a duplicate phone with ConflictException (409)", async (): Promise<void> => {
      mockUserRepository.findByUsername.mockResolvedValue(activeUser());

      await expect(
        service.register({ phone: "4141234567", password: "1234" }, undefined, "corr-2"),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("authenticates a player with valid phone + password", async (): Promise<void> => {
      mockUserRepository.findByUsername.mockResolvedValue(activeUser());
      mockUserRepository.save.mockResolvedValue(undefined);

      const dto: LoginUserDto = { phone: "4141234567", password: "1234" };
      const result = await service.login(dto, undefined, "corr-3");

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("4141234567");
      expect(result.access_token).toBe("mock-access-token");
      expect(result.username).toBe("4141234567");
    });

    it("rejects an unknown phone", async (): Promise<void> => {
      mockUserRepository.findByUsername.mockResolvedValue(null);
      await expect(
        service.login({ phone: "0000000000", password: "1234" }, undefined, "corr-4"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a wrong password", async (): Promise<void> => {
      mockUserRepository.findByUsername.mockResolvedValue(activeUser());
      await expect(
        service.login({ phone: "4141234567", password: "wrong" }, undefined, "corr-5"),
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
      mockUserRepository.findByUsername.mockResolvedValue(blocked);
      await expect(
        service.login({ phone: "4141234567", password: "1234" }, undefined, "corr-6"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
