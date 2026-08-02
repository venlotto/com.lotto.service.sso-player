/**
 * Typed boundary for environment variables.
 *
 * `process.env` may only be read from this module. Accessors are lazy (they
 * read at call time, not at import time) so `dotenv.config()` in `main.ts`
 * keeps working exactly as before. Every accessor preserves the defaults and
 * falsy semantics of the ad-hoc reads it replaces.
 */

/** COOKIE_SECRET — passed verbatim to cookie-parser (may be undefined). */
export function getCookieSecret(): string | undefined {
  return process.env["COOKIE_SECRET"];
}

/**
 * APP_PORT — `process.env.APP_PORT || 3000` (empty string falls back).
 * Returned as a string; Node normalizes numeric strings in `listen()`, so
 * the effective port is identical to the original number default.
 */
export function getAppPort(): string {
  const raw = process.env["APP_PORT"];
  return raw === undefined || raw === "" ? "3000" : raw;
}

/** APP_NAME — used only in the startup log line (may be undefined). */
export function getAppName(): string | undefined {
  return process.env["APP_NAME"];
}

/** THROTTLE_TTL_SECONDS — `... || "60"`. */
export function getThrottleTtlSeconds(): string {
  const raw = process.env["THROTTLE_TTL_SECONDS"];
  return raw === undefined || raw === "" ? "60" : raw;
}

/** THROTTLE_LIMIT — `... || "10"`. */
export function getThrottleLimit(): string {
  const raw = process.env["THROTTLE_LIMIT"];
  return raw === undefined || raw === "" ? "10" : raw;
}

/** JWT_SECRET — passed verbatim to JwtModule (may be undefined). */
export function getJwtSecret(): string | undefined {
  return process.env["JWT_SECRET"];
}

/**
 * ALLOWED_ORIGINS — `?? ""`, then comma-split, trimmed, empties dropped.
 * Returns the parsed list the CORS middleware consumes.
 */
export function getAllowedOrigins(): string[] {
  const raw = process.env["ALLOWED_ORIGINS"] ?? "";
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/** CORS_FALLBACK_ORIGIN — `?? ""`. */
export function getCorsFallbackOrigin(): string {
  return process.env["CORS_FALLBACK_ORIGIN"] ?? "";
}
