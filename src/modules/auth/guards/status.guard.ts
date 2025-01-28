import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "@nestjs/common";

import { UserStatus } from "../../user/model/enum/user-status.enum";

interface RequestUser {
  userId: string;
  status: UserStatus;
  username: string;
}

@Injectable()
export class StatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request["user"] as RequestUser;
    const correlationId = request["correlationId"];

    if (!user) {
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
