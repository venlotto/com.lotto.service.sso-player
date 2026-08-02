import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { UserStatus } from "../../user/model/enum/user-status.enum";
import { StatusGuard } from "./status.guard";

describe("StatusGuard", () => {
  let guard: StatusGuard;

  const createMockExecutionContext = (
    request: Record<string, unknown>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(() => {
    guard = new StatusGuard();
  });

  describe("canActivate", () => {
    it("should return true when the user is active", () => {
      const context = createMockExecutionContext({
        correlationId: "corr-1",
        user: { userId: "user-1", status: UserStatus.ACTIVE },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should throw UnauthorizedException when the request has no user", () => {
      const context = createMockExecutionContext({ correlationId: "corr-2" });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        "User not found in request",
      );
    });

    it("should throw UnauthorizedException when the user is blocked", () => {
      const context = createMockExecutionContext({
        correlationId: "corr-3",
        user: { userId: "user-1", status: UserStatus.BLOCKED },
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow("Account is not active");
    });
  });
});
