import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

interface CorrelatedRequest {
  correlationId?: string;
}

export const CorrelationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<CorrelatedRequest>();
    const correlationId = request.correlationId;
    return correlationId !== undefined && correlationId !== ""
      ? correlationId
      : null;
  },
);
