import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface CorrelatedRequest extends Request {
  correlationId?: string;
}

interface RawResponseBody {
  message?: unknown;
  meta?: unknown;
  data?: unknown;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Record<string, unknown>> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    const status = response.statusCode;
    const correlationId = request.correlationId;

    return next.handle().pipe(
      map((rawData: unknown) => {
        this.logger.debug(`Raw response data: ${JSON.stringify(rawData)}`, {
          correlationId,
        });

        const rawDataObject =
          typeof rawData === "object" && rawData !== null
            ? (rawData as RawResponseBody)
            : undefined;

        // For successful responses
        const standardResponse: Record<string, unknown> = {
          message:
            typeof rawDataObject?.message === "string"
              ? rawDataObject.message
              : "Success",
          status_code: status,
          meta: {
            correlation_id: correlationId,
            ...(typeof rawDataObject?.meta === "object" &&
            rawDataObject.meta !== null
              ? (rawDataObject.meta as Record<string, unknown>)
              : {}),
          },
        };

        // Handle data field
        if (rawData !== undefined && rawData !== null) {
          if (rawDataObject?.data !== undefined) {
            standardResponse["data"] = rawDataObject.data;
          } else if (
            typeof rawData === "object" &&
            rawDataObject?.message === undefined
          ) {
            standardResponse["data"] = rawData;
          }
        }

        this.logger.debug(
          `Standardized response: ${JSON.stringify(standardResponse)}`,
          { correlationId },
        );
        return standardResponse;
      }),
    );
  }
}
