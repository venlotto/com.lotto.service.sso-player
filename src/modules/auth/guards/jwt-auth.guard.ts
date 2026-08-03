import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { type AuthenticatedRequest } from "../model/auth-user.model";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private context: ExecutionContext | null = null;

  constructor(private reflector: Reflector) {
    super();
  }

  public override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    this.context = context;
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic === true) {
      return true;
    }

    return super.canActivate(context);
  }

  public override handleRequest<TUser extends Record<string, unknown>>(
    err: unknown,
    user: TUser | false | null,
  ): TUser {
    const correlationId = this.getCorrelationId();

    if (Boolean(err) || user === null || user === false) {
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
      if (this.context === null) {
        return "unknown";
      }
      const request = this.context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();
      return request.correlationId ?? "unknown";
    } catch {
      return "unknown";
    }
  }
}
