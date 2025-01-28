import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const correlationId = request.correlationId || "unknown";

    if (!user) {
      throw new ForbiddenException({
        message: "User not found in request",
        error: "ForbiddenException",
        statusCode: 403,
        correlationId,
      });
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
      throw new ForbiddenException({
        message: "User has no permissions",
        error: "ForbiddenException",
        statusCode: 403,
        correlationId,
      });
    }

    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasAllRequiredPermissions) {
      throw new ForbiddenException({
        message: "User does not have the required permissions",
        error: "ForbiddenException",
        statusCode: 403,
        correlationId,
      });
    }

    return true;
  }
} 