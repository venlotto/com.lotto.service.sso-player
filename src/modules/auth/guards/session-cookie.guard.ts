import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

import { AuthService } from "../services/auth.service";

@Injectable()
export class SessionCookieGuard implements CanActivate {
  public constructor(private readonly authService: AuthService) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken = this.authService.extractRefreshToken(request);

    if (!refreshToken) {
      throw new UnauthorizedException("Authentication session cookie missing");
    }

    return true;
  }
}
