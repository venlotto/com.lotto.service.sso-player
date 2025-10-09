import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

interface JwtPayload {
  sub: string;
  username: string | null;
  role?: string;
  permissions?: string[];
  iss?: string;
  aud?: string | string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in configuration");
    }

    const cookieName =
      configService.get<string>("ACCESS_TOKEN_COOKIE_NAME") ?? null;

    const extractors = [ExtractJwt.fromAuthHeaderAsBearerToken()];

    if (cookieName) {
      extractors.unshift((request: Request): string | null => {
        if (!request) {
          return null;
        }
        const candidate = request as Request & {
          cookies?: Record<string, string>;
          signedCookies?: Record<string, string>;
        };
        return (
          candidate.cookies?.[cookieName] ??
          candidate.signedCookies?.[cookieName] ??
          null
        );
      });
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors(extractors),
      ignoreExpiration: false,
      secretOrKey: secret,
      audience: configService.get<string>("JWT_AUDIENCE") ?? undefined,
      issuer: configService.get<string>("JWT_ISSUER") ?? undefined,
    });
  }

  async validate(payload: JwtPayload): Promise<{
    sub: string;
    username: string | null;
    role?: string;
    permissions: string[];
  }> {
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      permissions: payload.permissions ?? [],
    };
  }
}
