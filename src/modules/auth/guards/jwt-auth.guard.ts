import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private context: ExecutionContext;

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    this.context = context;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    const correlationId = this.getCorrelationId();

    if (err || !user) {
      throw new UnauthorizedException({
        message: "Unauthorized access",
        error: "Unauthorized",
        correlation_id: correlationId,
      });
    }
    return user;
  }

  private getCorrelationId(): string {
    try {
      if (!this.context) {
        return "unknown";
      }
      const request = this.context.switchToHttp().getRequest();
      return request.correlationId || "unknown";
    } catch (error) {
      return "unknown";
    }
  }
}
