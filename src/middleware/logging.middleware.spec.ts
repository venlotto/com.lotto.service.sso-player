import { type NextFunction, type Request, type Response } from "express";
import { LoggingMiddleware } from "./logging.middleware";

describe("LoggingMiddleware", () => {
  let middleware: LoggingMiddleware;
  let logSpy: jest.SpyInstance;
  let next: NextFunction;
  let finishCallback: (() => void) | undefined;

  const buildResponse = (statusCode: number): Response => {
    const response: { on: jest.Mock; statusCode: number } = {
      statusCode,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === "finish") {
          finishCallback = callback;
        }
        return response;
      }),
    };
    return response as unknown as Response;
  };

  const buildRequest = (): Request =>
    ({
      method: "GET",
      originalUrl: "/v1/auth/session",
    }) as unknown as Request;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
    logSpy = jest
      .spyOn(middleware.logger, "log")
      .mockImplementation(() => undefined);
    next = jest.fn() as unknown as NextFunction;
    finishCallback = undefined;
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("should always call next", () => {
    middleware.use(buildRequest(), buildResponse(200), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("should log method, url and status when the response finishes with 200", () => {
    middleware.use(buildRequest(), buildResponse(200), next);
    finishCallback?.();

    expect(logSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = logSpy.mock.calls[0][0] as string;
    expect(loggedMessage).toContain("GET /v1/auth/session 200");
  });

  it("should log when the response finishes with 201", () => {
    middleware.use(buildRequest(), buildResponse(201), next);
    finishCallback?.();

    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it("should not log when the response finishes with another status", () => {
    middleware.use(buildRequest(), buildResponse(500), next);
    finishCallback?.();

    expect(logSpy).not.toHaveBeenCalled();
  });
});
