import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { UserStatus } from "../../user/model/enum/user-status.enum";
import { type AuthenticatedRequest } from "../model/auth-user.model";

@Injectable()
export class StatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const correlationId = request.correlationId;

    if (user === undefined || user === null) {
      throw new UnauthorizedException({
        message: "User not found in request",
        error: "Unauthorized",
        correlation_id: correlationId,
      });
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException({
        message: "Account is not active",
        error: "Unauthorized",
        correlation_id: correlationId,
      });
    }
    return true;
  }
}
