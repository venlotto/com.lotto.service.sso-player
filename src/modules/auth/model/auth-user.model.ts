import type { Request } from "express";
import type { UserRoles } from "../../user/model/enum/user-roles.enum";
import type { UserStatus } from "../../user/model/enum/user-status.enum";

/**
 * The principal the auth layer attaches to `request.user` after a strategy
 * has validated the credentials. Different strategies populate different
 * subsets — the JWT strategy fills `sub`/`username`/`role`/`permissions`,
 * while other flows may expose `roleName` or `status` — so every field is
 * optional and each guard checks the fields it depends on.
 */
export interface AuthUser {
  sub?: string | undefined;
  username?: string | null | undefined;
  role?: string | undefined;
  roleName?: UserRoles | undefined;
  roles?: string[] | undefined;
  permissions?: string[] | null | undefined;
  status?: UserStatus | undefined;
}

/**
 * Express request as seen past the correlation-id middleware and an auth
 * guard: it may carry an authenticated principal and a correlation id.
 * Built with `Omit` because `@types/passport` declares `Request.user` in a
 * way that cannot be redeclared as nullable in an interface extension.
 */
export type AuthenticatedRequest = Omit<Request, "user"> & {
  user?: AuthUser | null | undefined;
  correlationId?: string | undefined;
};
