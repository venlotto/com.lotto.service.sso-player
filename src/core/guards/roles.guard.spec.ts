import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from "@nestjs/common";
import { type Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard (core)", () => {
  let getAllAndOverrideMock: jest.Mock;
  let guard: RolesGuard;

  const handler = (): void => undefined;

  class GuardedController {}

  beforeEach(() => {
    getAllAndOverrideMock = jest.fn();
    const reflector = {
      getAllAndOverride: getAllAndOverrideMock,
    } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  const buildContext = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
      getClass: () => GuardedController,
    }) as unknown as ExecutionContext;

  it("should allow the request when no roles are required", () => {
    getAllAndOverrideMock.mockReturnValue(null);

    expect(guard.canActivate(buildContext({}))).toBe(true);
  });

  it("should throw UnauthorizedException when the request has no user", () => {
    getAllAndOverrideMock.mockReturnValue(["ADMIN"]);

    expect(() => guard.canActivate(buildContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it("should throw ForbiddenException when the user has no role", () => {
    getAllAndOverrideMock.mockReturnValue(["ADMIN"]);

    expect(() => guard.canActivate(buildContext({ user: {} }))).toThrow(
      ForbiddenException,
    );
  });

  it("should throw ForbiddenException when the user role is not required", () => {
    getAllAndOverrideMock.mockReturnValue(["ADMIN"]);

    expect(() =>
      guard.canActivate(buildContext({ user: { role: { name: "PLAYER" } } })),
    ).toThrow(ForbiddenException);
  });

  it("should allow the request when the user role matches a required role", () => {
    getAllAndOverrideMock.mockReturnValue(["ADMIN", "MANAGER"]);

    expect(
      guard.canActivate(buildContext({ user: { role: { name: "MANAGER" } } })),
    ).toBe(true);
  });
});
