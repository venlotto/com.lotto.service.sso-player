import { type NextFunction, type Request, type Response } from "express";
import { CorrelationIdMiddleware } from "./correlation-id.middleware";

interface MockCorrelatedRequest {
  headers: Record<string, string | string[] | undefined>;
  correlationId?: string;
}

describe("CorrelationIdMiddleware", () => {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  let middleware: CorrelationIdMiddleware;
  let response: Response;
  let setHeaderMock: jest.Mock;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    setHeaderMock = jest.fn();
    response = { setHeader: setHeaderMock } as unknown as Response;
    next = jest.fn() as unknown as NextFunction;
  });

  const runMiddleware = (
    headers: Record<string, string | string[] | undefined>,
  ): MockCorrelatedRequest => {
    const request: MockCorrelatedRequest = { headers };
    middleware.use(request as unknown as Request, response, next);
    return request;
  };

  it("should reuse an incoming correlation id header", () => {
    const request = runMiddleware({ "x-correlation-id": "corr-incoming" });

    expect(request.correlationId).toBe("corr-incoming");
    expect(setHeaderMock).toHaveBeenCalledWith(
      "X-Correlation-ID",
      "corr-incoming",
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should use the first entry when the header arrives as an array", () => {
    const request = runMiddleware({
      "x-correlation-id": ["corr-first", "corr-second"],
    });

    expect(request.correlationId).toBe("corr-first");
    expect(setHeaderMock).toHaveBeenCalledWith(
      "X-Correlation-ID",
      "corr-first",
    );
  });

  it("should generate a uuid when the header is absent", () => {
    const request = runMiddleware({});

    expect(request.correlationId).toMatch(UUID_PATTERN);
    expect(setHeaderMock).toHaveBeenCalledWith(
      "X-Correlation-ID",
      request.correlationId,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should generate a uuid when the header is an empty string", () => {
    const request = runMiddleware({ "x-correlation-id": "" });

    expect(request.correlationId).toMatch(UUID_PATTERN);
    expect(setHeaderMock).toHaveBeenCalledWith(
      "X-Correlation-ID",
      request.correlationId,
    );
  });
});
