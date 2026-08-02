import { type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, type TestingModule } from "@nestjs/testing";
import { UserRoles } from "../../user/model/enum/user-roles.enum";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  let guard: RolesGuard;

  const mockReflector = {
    get: jest.fn(),
  };

  const handler = (): void => undefined;

  const createMockExecutionContext = (
    request: Record<string, unknown>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("canActivate", () => {
    it("should return true when no roles are required", () => {
      mockReflector.get.mockReturnValue(undefined);
      const context = createMockExecutionContext({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should return true when the user has a required role", () => {
      mockReflector.get.mockReturnValue([UserRoles.ADMIN, UserRoles.MANAGER]);
      const context = createMockExecutionContext({
        user: { roleName: UserRoles.ADMIN },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should return false when the user lacks every required role", () => {
      mockReflector.get.mockReturnValue([UserRoles.ADMIN]);
      const context = createMockExecutionContext({
        user: { roleName: UserRoles.GUEST },
      });

      expect(guard.canActivate(context)).toBe(false);
    });

    it("should return false when the user has no role name", () => {
      mockReflector.get.mockReturnValue([UserRoles.ADMIN]);
      const context = createMockExecutionContext({
        user: { sub: "user-1" },
      });

      expect(guard.canActivate(context)).toBe(false);
    });
  });
});
