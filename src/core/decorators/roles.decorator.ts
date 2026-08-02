import { SetMetadata } from "@nestjs/common";
import type { UserRoles } from "../../modules/user/model/enum/user-roles.enum";

export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRoles[]): MethodDecorator =>
  SetMetadata(ROLES_KEY, roles);
