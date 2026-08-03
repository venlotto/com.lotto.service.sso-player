import { type ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, type TestingModule } from "@nestjs/testing";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { PermissionGuard } from "./permission.guard";

describe("PermissionGuard", () => {
  let guard: PermissionGuard;

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

  const mockMetadata = (
    isPublic: boolean,
    requiredPermissions: string[] | undefined,
  ): void => {
    const metadata: Record<string, unknown> = {
      [IS_PUBLIC_KEY]: isPublic,
      [PERMISSIONS_KEY]: requiredPermissions,
    };
    mockReflector.getAllAndOverride.mockImplementation(
      (key: string): unknown => metadata[key],
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("canActivate", () => {
    it("should return true when the route is public", () => {
      mockMetadata(true, ["com.lotto.service.sso-internal:user:create"]);
      const context = createMockExecutionContext({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should return true when no permissions are required", () => {
      mockMetadata(false, undefined);
      const context = createMockExecutionContext({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should throw ForbiddenException when the request has no user", () => {
      mockMetadata(false, ["com.lotto.service.sso-internal:user:create"]);
      const context = createMockExecutionContext({ correlationId: "corr-1" });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        "User not found in request",
      );
    });

    it("should throw ForbiddenException when the user has no permissions array", () => {
      mockMetadata(false, ["com.lotto.service.sso-internal:user:create"]);
      const context = createMockExecutionContext({
        correlationId: "corr-2",
        user: { sub: "user-1" },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        "User has no permissions",
      );
    });

    it("should throw ForbiddenException when a required permission is missing", () => {
      mockMetadata(false, [
        "com.lotto.service.sso-internal:user:create",
        "com.lotto.service.sso-internal:user:delete",
      ]);
      const context = createMockExecutionContext({
        correlationId: "corr-3",
        user: {
          sub: "user-1",
          permissions: ["com.lotto.service.sso-internal:user:create"],
        },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        "User does not have the required permissions",
      );
    });

    it("should return true when the user has every required permission", () => {
      mockMetadata(false, [
        "com.lotto.service.sso-internal:user:create",
        "com.lotto.service.sso-internal:user:delete",
      ]);
      const context = createMockExecutionContext({
        correlationId: "corr-4",
        user: {
          sub: "user-1",
          permissions: [
            "com.lotto.service.sso-internal:user:create",
            "com.lotto.service.sso-internal:user:delete",
            "com.lotto.service.sso-internal:user:read",
          ],
        },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should fall back to an unknown correlation id when the request has none", () => {
      mockMetadata(false, ["com.lotto.service.sso-internal:user:create"]);
      const context = createMockExecutionContext({
        user: { sub: "user-1" },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
