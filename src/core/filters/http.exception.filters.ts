import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

interface CorrelatedRequest extends Request {
  correlationId?: string;
}

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
    const request = ctx.getRequest<CorrelatedRequest>();
    const correlationId = request.correlationId;

    if (exception instanceof HttpException) {
      const body = HttpExceptionFilter.extractBody(exception.getResponse());
      if (body !== null) {
        const handled = this.respondWithExceptionBody(
          exception,
          response,
          body,
          correlationId,
        );
        if (handled !== null) {
          return handled;
        }
      }
    }

    return this.respondWithFallback(exception, response, correlationId);
  }

  private static extractBody(
    exceptionResponse: unknown,
  ): ExceptionResponseBody | null {
    if (
      typeof exceptionResponse !== "object" ||
      exceptionResponse === null ||
      Array.isArray(exceptionResponse)
    ) {
      return null;
    }
    return exceptionResponse as ExceptionResponseBody;
  }

  private respondWithExceptionBody(
    exception: HttpException,
    response: Response,
    body: ExceptionResponseBody,
    correlationId: string | undefined,
  ): Response | null {
    const status = exception.getStatus();

    // Handle validation errors
    if (Array.isArray(body.message)) {
      const errorResponse = {
        message: body.message[0],
        error:
          body.error !== undefined && body.error !== ""
            ? body.error
            : "BadRequestException",
        status_code: status,
        meta: {
          correlation_id: correlationId,
          validation_errors: body.message,
        },
      };

      this.logger.error(
        `Validation Error: ${body.message.join(", ")}`,
        undefined,
        { correlationId },
      );

      return response.status(status).json(errorResponse);
    }

    // Handle custom exception responses
    if (body.message !== undefined && body.message !== "") {
      const errorResponse = {
        message: body.message,
        error:
          body.error !== undefined && body.error !== ""
            ? body.error
            : exception.name,
        status_code: status,
        meta: {
          correlation_id: correlationId,
          ...(body.meta ?? {}),
        },
      };

      this.logger.error(
        `HTTP Exception: ${body.message}`,
        exception instanceof Error ? exception.stack : undefined,
        { correlationId },
      );

      return response.status(status).json(errorResponse);
    }

    return null;
  }

  private respondWithFallback(
    exception: unknown,
    response: Response,
    correlationId: string | undefined,
  ): Response {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error = "InternalServerError";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: unknown = exception.getResponse();
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
