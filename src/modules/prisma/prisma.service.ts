import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ["error", "warn"],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        prisma: {
          status: "up",
        },
      };
    } catch (error) {
      throw new HealthCheckError("Prisma health check failed", {
        prisma: {
          status: "down",
          error: error.message,
        },
      });
    }
  }
}
