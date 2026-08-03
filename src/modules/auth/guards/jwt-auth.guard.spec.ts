import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, type TestingModule } from "@nestjs/testing";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const handler = (): void => undefined;
  const target = class TestTarget {};

  const createMockExecutionContext = (
    request: Record<string, unknown>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
      getClass: () => target,
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("canActivate", () => {
    it("should return true when the route is public", () => {
      mockReflector.getAllAndOverride.mockImplementation((key: string) =>
        key === IS_PUBLIC_KEY ? true : undefined,
      );
      const context = createMockExecutionContext({});

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("handleRequest", () => {
    it("should return the user when authentication succeeded", () => {
      const context = createMockExecutionContext({ correlationId: "corr-1" });
      mockReflector.getAllAndOverride.mockReturnValue(true);
      expect(guard.canActivate(context)).toBe(true);

      const user = { sub: "user-1", permissions: [] };

      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it("should throw UnauthorizedException when passport reports an error", () => {
      const context = createMockExecutionContext({ correlationId: "corr-2" });
      mockReflector.getAllAndOverride.mockReturnValue(true);
      expect(guard.canActivate(context)).toBe(true);

      expect(() =>
        guard.handleRequest(new Error("jwt expired"), { sub: "user-1" }),
      ).toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException when there is no user", () => {
      const context = createMockExecutionContext({ correlationId: "corr-3" });
      mockReflector.getAllAndOverride.mockReturnValue(true);
      expect(guard.canActivate(context)).toBe(true);

      expect(() => guard.handleRequest(null, null)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, false)).toThrow(
        UnauthorizedException,
      );
    });

    it("should attach the request correlation id to the exception", () => {
      const context = createMockExecutionContext({ correlationId: "corr-4" });
      mockReflector.getAllAndOverride.mockReturnValue(true);
      expect(guard.canActivate(context)).toBe(true);

      try {
        guard.handleRequest(null, null);
        throw new Error("expected handleRequest to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        const response = (
          error as UnauthorizedException
        ).getResponse() as { correlation_id: string };
        expect(response.correlation_id).toBe("corr-4");
      }
    });

    it("should fall back to an unknown correlation id without a context", () => {
      try {
        guard.handleRequest(null, null);
        throw new Error("expected handleRequest to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        const response = (
          error as UnauthorizedException
        ).getResponse() as { correlation_id: string };
        expect(response.correlation_id).toBe("unknown");
      }
    });
  });
});
