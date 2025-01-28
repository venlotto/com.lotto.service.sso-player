import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        message: "User is not authenticated",
        error: "Unauthorized",
        status_code: 401,
      });
    }

    if (!user.role) {
      throw new ForbiddenException({
        message: "User role is not defined",
        error: "Forbidden",
        status_code: 403,
      });
    }

    const hasRole = requiredRoles.some((role) => user.role.name === role);

    if (!hasRole) {
      throw new ForbiddenException({
        message: "User does not have the required role",
        error: "Forbidden",
        status_code: 403,
      });
    }

    return true;
  }
}
