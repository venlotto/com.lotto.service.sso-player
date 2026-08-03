import { InternalServerErrorException, type Logger } from "@nestjs/common";
import { type CreatePermissionDto } from "../dto/create-permission.dto";
import { type PermissionService } from "../services/permission.service";
import { PermissionController } from "./permission.controller";

const mockPermissionService = {
  createPermission: jest.fn(),
  getAllPermissions: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
};

const controller = (): PermissionController =>
  new PermissionController(
    mockPermissionService as unknown as PermissionService,
    mockLogger as unknown as Logger,
  );

describe("PermissionController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPermission", () => {
    const dto: CreatePermissionDto = {
      name: "com.lotto.service.sso-internal:user:read",
      description: "Read users",
    };

    it("returns the created permission on success", async (): Promise<void> => {
      mockPermissionService.createPermission.mockResolvedValue({
        id: "perm-1",
        ...dto,
      });

      const result = await controller().createPermission(dto, "corr-1");

      expect(result).toMatchObject({ id: "perm-1", name: dto.name });
      expect(mockPermissionService.createPermission).toHaveBeenCalledWith(
        dto,
        "corr-1",
      );
    });

    it("maps a service failure to InternalServerErrorException", async (): Promise<void> => {
      mockPermissionService.createPermission.mockRejectedValue(
        new Error("store down"),
      );

      await expect(
        controller().createPermission(dto, "corr-2"),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "store down",
        expect.any(String),
        { correlationId: "corr-2" },
      );
    });
  });

  describe("getAllPermissions", () => {
    it("returns the permission list on success", async (): Promise<void> => {
      mockPermissionService.getAllPermissions.mockResolvedValue([
        { id: "perm-1", name: "p" },
      ]);

      const result = await controller().getAllPermissions("corr-3");

      expect(result).toEqual([{ id: "perm-1", name: "p" }]);
    });

    it("maps a service failure to InternalServerErrorException", async (): Promise<void> => {
      mockPermissionService.getAllPermissions.mockRejectedValue(
        new Error("store down"),
      );

      await expect(
        controller().getAllPermissions("corr-4"),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "store down",
        expect.any(String),
        { correlationId: "corr-4" },
      );
    });
  });
});
