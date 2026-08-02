import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";
import { TransformInterceptor } from "./transform.interceptor";

const createContext = (
  statusCode: number,
  correlationId?: string,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getResponse: () => ({ statusCode }),
      getRequest: () => ({ correlationId }),
    }),
  }) as unknown as ExecutionContext;

const handlerOf = (data: unknown): CallHandler => ({
  handle: () => of(data),
});

describe("TransformInterceptor", () => {
  let interceptor: TransformInterceptor;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    jest
      .spyOn(interceptor["logger"], "debug")
      .mockImplementation(() => undefined);
  });

  const intercept = (
    data: unknown,
    statusCode = 200,
    correlationId = "corr-1",
  ): Promise<Record<string, unknown>> =>
    new Promise((resolve, reject) => {
      interceptor
        .intercept(createContext(statusCode, correlationId), handlerOf(data))
        .subscribe({ next: resolve, error: reject });
    });

  it("wraps a message-bearing payload without adding data", async () => {
    const result = await intercept({ message: "Created" }, 201);

    expect(result).toEqual({
      message: "Created",
      status_code: 201,
      meta: { correlation_id: "corr-1" },
    });
  });

  it("passes through an explicit data field and merges meta", async () => {
    const result = await intercept({
      message: "OK",
      data: { id: 1 },
      meta: { pagination: { page: 1 } },
    });

    expect(result).toEqual({
      message: "OK",
      status_code: 200,
      meta: { correlation_id: "corr-1", pagination: { page: 1 } },
      data: { id: 1 },
    });
  });

  it("treats a plain object payload as data with the default message", async () => {
    const result = await intercept({ id: 7, name: "x" });

    expect(result).toEqual({
      message: "Success",
      status_code: 200,
      meta: { correlation_id: "corr-1" },
      data: { id: 7, name: "x" },
    });
  });

  it("does not add a data field for scalar payloads", async () => {
    const result = await intercept("plain");

    expect(result).toEqual({
      message: "Success",
      status_code: 200,
      meta: { correlation_id: "corr-1" },
    });
  });

  it("does not add a data field for null or undefined payloads", async () => {
    expect(await intercept(null)).toEqual({
      message: "Success",
      status_code: 200,
      meta: { correlation_id: "corr-1" },
    });
    expect(await intercept(undefined)).toEqual({
      message: "Success",
      status_code: 200,
      meta: { correlation_id: "corr-1" },
    });
  });
});
