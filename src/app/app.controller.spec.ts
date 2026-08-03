import { InternalServerErrorException, type Logger } from "@nestjs/common";
import { type HealthCheckResult, type HealthCheckService } from "@nestjs/terminus";
import { type Request as ExpressRequest } from "express";
import { type PrismaService } from "../modules/prisma/prisma.service";
import { AppController } from "./app.controller";

const mockHealthCheckService = {
  check: jest.fn(),
};

const mockPrismaService = {
  isHealthy: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
};

const controller = (): AppController =>
  new AppController(
    mockHealthCheckService as unknown as HealthCheckService,
    mockPrismaService as unknown as PrismaService,
    mockLogger as unknown as Logger,
  );

const buildReq = (correlationId?: string): ExpressRequest =>
  ({ correlationId }) as unknown as ExpressRequest;

const healthResult = {
  status: "ok",
  info: {},
  error: {},
  details: {},
} as HealthCheckResult;

describe("AppController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getHealth", () => {
    it("returns the health check result on success", async (): Promise<void> => {
      mockHealthCheckService.check.mockResolvedValue(healthResult);

      const result = await controller().getHealth(buildReq("corr-1"));

      expect(result).toStrictEqual(healthResult);
      expect(mockHealthCheckService.check).toHaveBeenCalledTimes(1);
      expect(mockLogger.log).toHaveBeenCalledWith(
        "Performing health check",
        { correlationId: "corr-1" },
      );
    });

    it("maps an Error rejection to InternalServerErrorException", async (): Promise<void> => {
      mockHealthCheckService.check.mockRejectedValue(new Error("db down"));

      await expect(controller().getHealth(buildReq("corr-2"))).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "db down",
        expect.any(String),
        { correlationId: "corr-2" },
      );
    });

    it("stringifies a non-Error rejection and still maps to 500", async (): Promise<void> => {
      mockHealthCheckService.check.mockRejectedValue("boom");

      await expect(controller().getHealth(buildReq("corr-3"))).rejects.toThrow(
        InternalServerErrorException,
      );
      // non-Error values have no stack → logged as undefined
      expect(mockLogger.error).toHaveBeenCalledWith(
        "boom",
        undefined,
        { correlationId: "corr-3" },
      );
    });
  });
});
