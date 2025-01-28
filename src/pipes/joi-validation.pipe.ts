import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Logger,
  PipeTransform,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(
    private schema: any,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  transform(value: any, metadata: ArgumentMetadata): any {
    const correlationId = this.request["correlationId"];
    try {
      if (metadata.type === "query") {
        const { error } = this.schema.query.validate(value);
        if (error) throw new Error(error);
      } else if (metadata.type === "body") {
        const { error } = this.schema.body.validate(value);
        if (error) throw new Error(error);
      }
    } catch (e) {
      Logger.error(`Validation error details : ${e.message}`, null, {
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
