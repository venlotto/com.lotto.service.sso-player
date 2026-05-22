import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

interface AllowedOrigin {
  raw: string;
  regex: RegExp;
}

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly allowedOrigins: AllowedOrigin[];
  private readonly allowAnyOrigin: boolean;
  private readonly fallbackOrigin: string;

  public constructor() {
    const envValue = process.env.ALLOWED_ORIGINS ?? "";
    const origins = envValue
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    this.allowAnyOrigin = origins.includes("*");
    this.allowedOrigins = origins
      .filter((origin) => origin !== "*")
      .map((origin) => ({
        raw: origin,
        regex: this.buildOriginRegex(origin),
      }));

    this.fallbackOrigin = process.env.CORS_FALLBACK_ORIGIN ?? "";
  }

  public use(req: Request, res: Response, next: NextFunction): void {
    const origin = req.headers.origin as string | undefined;

    if (origin && this.isOriginAllowed(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Vary", "Origin");
    } else if (this.allowAnyOrigin) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Credentials", "false");
    } else if (this.fallbackOrigin) {
      res.header("Access-Control-Allow-Origin", this.fallbackOrigin);
      res.header("Access-Control-Allow-Credentials", "false");
    }

    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, X-Game-Id, Game-Id, X-Correlation-Id, X-CSRF-Token, X-Client-Type",
    );
    res.header(
      "Access-Control-Expose-Headers",
      "Set-Cookie, X-CSRF-Token, X-Correlation-Id",
    );

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  }

  private isOriginAllowed(origin: string): boolean {
    if (this.allowAnyOrigin) {
      return true;
    }

    return this.allowedOrigins.some((allowed) => allowed.regex.test(origin));
  }

  private buildOriginRegex(origin: string): RegExp {
    if (!origin.includes("*")) {
      return new RegExp(`^${origin.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&")}$`);
    }

    const escaped = origin
      .split("*")
      .map((segment) => segment.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&"))
      .join(".*");

    return new RegExp(`^${escaped}$`);
  }
}
