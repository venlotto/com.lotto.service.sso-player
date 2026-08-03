import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { type AuthUser } from "../model/auth-user.model";

interface JwtPayload {
  sub: string;
  username: string | null;
  role?: string;
  permissions?: string[];
  iss?: string;
  aud?: string | string[];
}

type JwtFromRequest = (request: Request) => string | null;

/**
 * Minimal typings for the untyped `passport-jwt` module: only the extractor
 * factory and the strategy constructor surface this service actually uses.
 */
interface JwtExtractors {
  fromAuthHeaderAsBearerToken(): JwtFromRequest;
  fromExtractors(extractors: JwtFromRequest[]): JwtFromRequest;
}

interface JwtStrategyOptions {
  jwtFromRequest: JwtFromRequest;
  ignoreExpiration: boolean;
  secretOrKey: string;
  audience?: string | undefined;
  issuer?: string | undefined;
}

const extractJwt = ExtractJwt as unknown as JwtExtractors;
const PassportJwtStrategy = Strategy as unknown as new (
  options: JwtStrategyOptions,
) => object;

@Injectable()
export class JwtStrategy extends PassportStrategy(PassportJwtStrategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>("JWT_SECRET");
    if (secret === undefined || secret === "") {
      throw new Error("JWT_SECRET is not defined in configuration");
    }

    const cookieName =
      configService.get<string>("ACCESS_TOKEN_COOKIE_NAME") ?? null;

    const extractors: JwtFromRequest[] = [
      extractJwt.fromAuthHeaderAsBearerToken(),
    ];

    if (cookieName !== null && cookieName !== "") {
      extractors.unshift(
        (request: Request | null | undefined): string | null => {
          if (request === null || request === undefined) {
            return null;
          }
          const candidate: {
            cookies?: Record<string, string>;
            signedCookies?: Record<string, string>;
          } = request;
          return (
            candidate.cookies?.[cookieName] ??
            candidate.signedCookies?.[cookieName] ??
            null
          );
        },
      );
    }

    super({
      jwtFromRequest: extractJwt.fromExtractors(extractors),
      ignoreExpiration: false,
      secretOrKey: secret,
      audience: configService.get<string>("JWT_AUDIENCE") ?? undefined,
      issuer: configService.get<string>("JWT_ISSUER") ?? undefined,
    });
  }

  public validate(payload: JwtPayload): AuthUser {
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      permissions: payload.permissions ?? [],
    };
  }
}
