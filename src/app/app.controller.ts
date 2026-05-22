import {
  Controller,
  Get,
  Logger,
  InternalServerErrorException,
  Request,
} from "@nestjs/common";
import { ApiHeader, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckResult,
  HealthIndicatorResult,
  HealthCheckService,
} from "@nestjs/terminus";
import { Request as ExpressRequest } from "express";

import { Public } from "../modules/auth/decorators/public.decorator";
import { PrismaService } from "../modules/prisma/prisma.service";

@ApiTags("Health")
@Controller()
@ApiHeader({
  name: "X-Correlation-Id",
  description: "Correlation ID for request tracing (optional)",
  required: false,
  schema: {
    type: "string",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000",
  },
})
export class AppController {
  constructor(
    private healthCheckService: HealthCheckService,
    private prismaService: PrismaService,
    private readonly logger: Logger = new Logger(AppController.name),
  ) {}

  @Get("/health")
  @Public()
  @HealthCheck()
  @ApiResponse({
    status: 200,
    description: "Health check successful",
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "An unexpected error occurred",
        },
        error: {
          type: "string",
          example: "InternalServerError",
        },
        statusCode: {
          type: "number",
          example: 500,
        },
        correlationId: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
  })
  public async getHealth(
    @Request() req: ExpressRequest,
  ): Promise<HealthCheckResult> {
    const correlationId = req["correlationId"];
    this.logger.log("Performing health check", { correlationId });

    try {
      return await this.healthCheckService.check([
        (): Promise<HealthIndicatorResult> => this.prismaService.isHealthy(),
      ]);
    } catch (error) {
      this.logger.error(error.message, error.stack, { correlationId });
      throw new InternalServerErrorException({
        message: "Error performing health check",
        error: "InternalServerError",
        statusCode: 500,
        correlationId,
      });
    }
  }
}
