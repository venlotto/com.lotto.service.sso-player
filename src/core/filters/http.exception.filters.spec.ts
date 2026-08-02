import { type ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { HttpExceptionFilter } from "./http.exception.filters";

interface CapturedResponse {
  statusCode: number;
  body: unknown;
}

const createHost = (
  correlationId?: string,
): { host: ArgumentsHost; captured: CapturedResponse } => {
  const captured: CapturedResponse = { statusCode: 0, body: undefined };
  const response = {
    status(code: number) {
      captured.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      captured.body = payload;
      return this;
    },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ correlationId }),
    }),
  } as unknown as ArgumentsHost;
  return { host, captured };
};

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jest.spyOn(filter["logger"], "error").mockImplementation(() => undefined);
  });

  it("maps validation-error arrays to the first message with validation_errors", () => {
    const exception = new HttpException(
      { message: ["must be a phone", "must be unique"], error: "Bad Request" },
      HttpStatus.BAD_REQUEST,
    );
    const { host, captured } = createHost("corr-1");

    filter.catch(exception, host);

    expect(captured.statusCode).toBe(400);
    expect(captured.body).toEqual({
      message: "must be a phone",
      error: "Bad Request",
      status_code: 400,
      meta: {
        correlation_id: "corr-1",
        validation_errors: ["must be a phone", "must be unique"],
      },
    });
  });

  it("defaults the error label for validation arrays without an error field", () => {
    const exception = new HttpException(
      { message: ["only error"] },
      HttpStatus.BAD_REQUEST,
    );
    const { host, captured } = createHost("corr-2");

    filter.catch(exception, host);

    expect(captured.body).toMatchObject({
      message: "only error",
      error: "BadRequestException",
      status_code: 400,
    });
  });

  it("maps object responses with a message, merging custom meta", () => {
    const exception = new HttpException(
      { message: "User exists", meta: { field: "username" } },
      HttpStatus.CONFLICT,
    );
    const { host, captured } = createHost("corr-3");

    filter.catch(exception, host);

    expect(captured.statusCode).toBe(409);
    expect(captured.body).toEqual({
      message: "User exists",
      error: "HttpException",
      status_code: 409,
      meta: {
        correlation_id: "corr-3",
        field: "username",
      },
    });
  });

  it("maps string responses to the fallback shape with the exception name", () => {
    const exception = new HttpException("plain failure", HttpStatus.FORBIDDEN);
    const { host, captured } = createHost("corr-4");

    filter.catch(exception, host);

    expect(captured.statusCode).toBe(403);
    expect(captured.body).toEqual({
      message: "plain failure",
      error: "HttpException",
      status_code: 403,
      meta: { correlation_id: "corr-4" },
    });
  });

  it("maps non-HTTP exceptions to a 500 fallback", () => {
    const { host, captured } = createHost("corr-5");

    filter.catch(new Error("boom"), host);

    expect(captured.statusCode).toBe(500);
    expect(captured.body).toEqual({
      message: "Internal server error",
      error: "InternalServerError",
      status_code: 500,
      meta: { correlation_id: "corr-5" },
    });
  });

  it("uses the fallback shape for object responses without a message", () => {
    const exception = new HttpException(
      { unrelated: true },
      HttpStatus.BAD_REQUEST,
    );
    const { host, captured } = createHost("corr-6");

    filter.catch(exception, host);

    expect(captured.statusCode).toBe(400);
    expect(captured.body).toEqual({
      message: "Internal server error",
      error: "InternalServerError",
      status_code: 400,
      meta: { correlation_id: "corr-6" },
    });
  });
});
