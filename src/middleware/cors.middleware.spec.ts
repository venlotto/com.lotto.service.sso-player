import { type NextFunction, type Request, type Response } from "express";
import { CorsMiddleware } from "./cors.middleware";

describe("CorsMiddleware", () => {
  const ENV_KEYS = ["ALLOWED_ORIGINS", "CORS_FALLBACK_ORIGIN"] as const;

  let savedEnv: Record<string, string | undefined>;
  let headerMock: jest.Mock;
  let sendStatusMock: jest.Mock;
  let response: Response;
  let next: NextFunction;

  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }

    headerMock = jest.fn();
    sendStatusMock = jest.fn();
    response = {
      header: headerMock,
      sendStatus: sendStatusMock,
    } as unknown as Response;
    next = jest.fn() as unknown as NextFunction;
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const savedValue = savedEnv[key];
      if (savedValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedValue;
      }
    }
  });

  const buildRequest = (
    origin: string | undefined,
    method = "GET",
  ): Request =>
    ({
      headers: origin === undefined ? {} : { origin },
      method,
    }) as unknown as Request;

  const allowOriginHeader = (): string | undefined => {
    const call = headerMock.mock.calls.find(
      ([name]: [string, string]) => name === "Access-Control-Allow-Origin",
    );
    return call?.[1] as string | undefined;
  };

  it("should echo an allowed exact origin and allow credentials", () => {
    process.env["ALLOWED_ORIGINS"] = "https://app.plus.bingo";
    const middleware = new CorsMiddleware();

    middleware.use(buildRequest("https://app.plus.bingo"), response, next);

    expect(allowOriginHeader()).toBe("https://app.plus.bingo");
    expect(headerMock).toHaveBeenCalledWith(
      "Access-Control-Allow-Credentials",
      "true",
    );
    expect(headerMock).toHaveBeenCalledWith("Vary", "Origin");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should allow an origin matching a wildcard subdomain entry", () => {
    process.env["ALLOWED_ORIGINS"] = "https://*.plus.bingo";
    const middleware = new CorsMiddleware();

    middleware.use(buildRequest("https://game.plus.bingo"), response, next);

    expect(allowOriginHeader()).toBe("https://game.plus.bingo");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should not set an allow-origin header for a disallowed origin without fallback", () => {
    process.env["ALLOWED_ORIGINS"] = "https://app.plus.bingo";
    const middleware = new CorsMiddleware();

    middleware.use(buildRequest("https://evil.example.com"), response, next);

    expect(allowOriginHeader()).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should use the fallback origin for a disallowed origin when configured", () => {
    process.env["ALLOWED_ORIGINS"] = "https://app.plus.bingo";
    process.env["CORS_FALLBACK_ORIGIN"] = "https://fallback.plus.bingo";
    const middleware = new CorsMiddleware();

    middleware.use(buildRequest("https://evil.example.com"), response, next);

    expect(allowOriginHeader()).toBe("https://fallback.plus.bingo");
    expect(headerMock).toHaveBeenCalledWith(
      "Access-Control-Allow-Credentials",
      "false",
    );
  });

  it("should answer with a wildcard origin when no origin header is present and * is allowed", () => {
    process.env["ALLOWED_ORIGINS"] = "*";
    const middleware = new CorsMiddleware();

    middleware.use(buildRequest(undefined), response, next);

    expect(allowOriginHeader()).toBe("*");
    expect(headerMock).toHaveBeenCalledWith(
      "Access-Control-Allow-Credentials",
      "false",
    );
  });

  it("should echo the request origin when * is allowed and an origin is present", () => {
    process.env["ALLOWED_ORIGINS"] = "*";
    const middleware = new CorsMiddleware();

    middleware.use(buildRequest("https://any.example.com"), response, next);

    expect(allowOriginHeader()).toBe("https://any.example.com");
  });

  it("should answer OPTIONS preflights with 204 and not call next", () => {
    process.env["ALLOWED_ORIGINS"] = "https://app.plus.bingo";
    const middleware = new CorsMiddleware();

    middleware.use(
      buildRequest("https://app.plus.bingo", "OPTIONS"),
      response,
      next,
    );

    expect(sendStatusMock).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });
});
