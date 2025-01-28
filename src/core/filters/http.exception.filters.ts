import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request["correlationId"];

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error = "InternalServerError";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      // Handle validation errors
      if (Array.isArray(exceptionResponse.message)) {
        const errorResponse = {
          message: exceptionResponse.message[0],
          error: exceptionResponse.error || "BadRequestException",
          status_code: status,
          meta: {
            correlation_id: correlationId,
            validation_errors: exceptionResponse.message,
          },
        };

        this.logger.error(
          `Validation Error: ${exceptionResponse.message.join(", ")}`,
          undefined,
          { correlationId },
        );

        return response.status(status).json(errorResponse);
      }

      // Handle custom exception responses
      if (typeof exceptionResponse === "object" && exceptionResponse.message) {
        const errorResponse = {
          message: exceptionResponse.message,
          error: exceptionResponse.error || exception.name,
          status_code: status,
          meta: {
            correlation_id: correlationId,
            ...(exceptionResponse.meta || {}),
          },
        };

        this.logger.error(
          `HTTP Exception: ${exceptionResponse.message}`,
          exception instanceof Error ? exception.stack : undefined,
          { correlationId },
        );

        return response.status(status).json(errorResponse);
      }

      message = exceptionResponse.message || exception.message;
      error = exceptionResponse.error || exception.name;
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

    response.status(status).json(errorResponse);
  }
}
