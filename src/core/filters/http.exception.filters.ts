import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

interface ExceptionResponseBody {
  message?: string | string[];
  error?: string;
  meta?: Record<string, unknown>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request["correlationId"];

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error = "InternalServerError";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null &&
        !Array.isArray(exceptionResponse)
      ) {
        const typedResponse = exceptionResponse as ExceptionResponseBody;

        // Handle validation errors
        if (Array.isArray(typedResponse.message)) {
          const errorResponse = {
            message: typedResponse.message[0],
            error: typedResponse.error || "BadRequestException",
            status_code: status,
            meta: {
              correlation_id: correlationId,
              validation_errors: typedResponse.message,
            },
          };

          this.logger.error(
            `Validation Error: ${typedResponse.message.join(", ")}`,
            undefined,
            { correlationId },
          );

          return response.status(status).json(errorResponse);
        }

        // Handle custom exception responses
        if (typedResponse.message) {
          const errorResponse = {
            message: typedResponse.message,
            error: typedResponse.error || exception.name,
            status_code: status,
            meta: {
              correlation_id: correlationId,
              ...(typedResponse.meta || {}),
            },
          };

          this.logger.error(
            `HTTP Exception: ${typedResponse.message}`,
            exception instanceof Error ? exception.stack : undefined,
            { correlationId },
          );

          return response.status(status).json(errorResponse);
        }
      }

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
        error = exception.name;
      }
    }

    const errorResponse = {
      message,
      error,
      status_code: status,
      meta: {
        correlation_id: correlationId,
      },
    };

    this.logger.error(
      `Unhandled Exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      { correlationId },
    );

    return response.status(status).json(errorResponse);
  }
}
