import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();
    const status = response.statusCode;
    const correlationId = request["correlationId"];

    return next.handle().pipe(
      map((rawData) => {
        this.logger.debug(`Raw response data: ${JSON.stringify(rawData)}`);

        // For successful responses
        const standardResponse: any = {
          message: rawData?.message || "Success",
          status_code: status,
          meta: {
            correlation_id: correlationId,
            ...(rawData?.meta || {}),
          },
        };

        // Handle data field
        if (rawData !== undefined && rawData !== null) {
          if (rawData.data !== undefined) {
            standardResponse.data = rawData.data;
          } else if (typeof rawData === "object" && !rawData.message) {
            standardResponse.data = rawData;
          }
        }

        this.logger.debug(
          `Standardized response: ${JSON.stringify(standardResponse)}`,
        );
        return standardResponse;
      }),
    );
  }
}
