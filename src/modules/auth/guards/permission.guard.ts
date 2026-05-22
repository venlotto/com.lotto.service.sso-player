import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

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
      this.logger.warn("User not found in request", { correlationId });
      throw new ForbiddenException({
        message: "User not found in request",
        error: "ForbiddenException",
        statusCode: 403,
        correlationId,
      });
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
      this.logger.warn("User has no permissions", {
        correlationId,
        userId: user.sub,
      });
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
      this.logger.warn("Insufficient permissions", {
        correlationId,
        userId: user.sub,
        required: requiredPermissions,
        has: user.permissions,
      });
      throw new ForbiddenException({
        message: "User does not have the required permissions",
        error: "ForbiddenException",
        statusCode: 403,
        correlationId,
      });
    }

    this.logger.debug("Permission check passed", {
      correlationId,
      userId: user.sub,
      permissions: requiredPermissions,
    });

    return true;
  }
}
