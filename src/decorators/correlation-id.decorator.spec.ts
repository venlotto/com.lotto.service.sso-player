import "reflect-metadata";
import { type ExecutionContext } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { CorrelationId } from "./correlation-id.decorator";

type CorrelationIdFactory = (
  data: unknown,
  ctx: ExecutionContext,
) => string | null;

const getDecoratorFactory = (): CorrelationIdFactory => {
  class DecoratorHost {
    public handler(@CorrelationId() _correlationId: string | null): void {
      // host only — the decorator metadata is what this spec exercises
    }
  }

  const argsMetadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    DecoratorHost,
    "handler",
  ) as Record<string, { factory: CorrelationIdFactory }>;
  const metadataKey = Object.keys(argsMetadata)[0];
  return argsMetadata[metadataKey].factory;
};

describe("CorrelationId decorator", () => {
  const factory = getDecoratorFactory();

  const buildContext = (correlationId?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () =>
          correlationId === undefined ? {} : { correlationId },
      }),
    }) as unknown as ExecutionContext;

  it("should return the correlation id set by the middleware", () => {
    expect(factory(null, buildContext("corr-123"))).toBe("corr-123");
  });

  it("should return null when the request has no correlation id", () => {
    expect(factory(null, buildContext())).toBeNull();
  });

  it("should return null when the correlation id is an empty string", () => {
    expect(factory(null, buildContext(""))).toBeNull();
  });
});
