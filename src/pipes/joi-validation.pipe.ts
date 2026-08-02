import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  PipeTransform,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";

interface CorrelatedRequest extends Request {
  correlationId?: string;
}

interface ValidationSchemaTarget {
  validate(value: unknown): { error?: Error };
}

interface ValidationSchema {
  query?: ValidationSchemaTarget;
  body?: ValidationSchemaTarget;
}

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(
    private readonly schema: ValidationSchema,
    @Inject(REQUEST) private readonly request: CorrelatedRequest,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const correlationId = this.request.correlationId;
    try {
      if (metadata.type === "query" && this.schema.query) {
        const { error } = this.schema.query.validate(value);
        if (error) {
          throw new Error(String(error));
        }
      } else if (metadata.type === "body" && this.schema.body) {
        const { error } = this.schema.body.validate(value);
        if (error) {
          throw new Error(String(error));
        }
      }
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Unknown validation error";
      Logger.error(`Validation error details : ${errorMessage}`, null, {
        correlationId,
      });
      throw new BadRequestException({
        message: "Validation failed",
        error: "BadRequestException",
        statusCode: 400,
        correlationId,
      });
    }
    return value;
  }
}
