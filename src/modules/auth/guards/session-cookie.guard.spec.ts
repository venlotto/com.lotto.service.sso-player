import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { AuthService } from "../services/auth.service";
import { SessionCookieGuard } from "./session-cookie.guard";

describe("SessionCookieGuard", () => {
  let guard: SessionCookieGuard;
  let authService: AuthService;

  const mockAuthService = {
    extractRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionCookieGuard,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    guard = module.get<SessionCookieGuard>(SessionCookieGuard);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (
    request: Record<string, unknown>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  describe("canActivate", () => {
    it("should return true when refresh token is present", () => {
      const mockRequest = {
        cookies: { plus_session: "valid-token" },
      };
      const context = createMockExecutionContext(mockRequest);

      mockAuthService.extractRefreshToken.mockReturnValue("valid-token");

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(authService.extractRefreshToken).toHaveBeenCalledWith(mockRequest);
    });

    it("should throw UnauthorizedException when refresh token is missing", () => {
      const mockRequest = {
        cookies: {},
      };
      const context = createMockExecutionContext(mockRequest);

      mockAuthService.extractRefreshToken.mockReturnValue(null);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        "Authentication session cookie missing",
      );
      expect(authService.extractRefreshToken).toHaveBeenCalledWith(mockRequest);
    });

    it("should throw UnauthorizedException when refresh token is empty string", () => {
      const mockRequest = {
        cookies: { plus_session: "" },
      };
      const context = createMockExecutionContext(mockRequest);

      mockAuthService.extractRefreshToken.mockReturnValue("");

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});
