import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../../../core/decorators/roles.decorator";
import { UserRoles } from "../../user/model/enum/user-roles.enum";
import {
  type AuthenticatedRequest,
  type AuthUser,
} from "../model/auth-user.model";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRoles[] | undefined>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (requiredRoles === undefined) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user as AuthUser;
    return requiredRoles.includes(user.roleName as UserRoles);
  }
}
