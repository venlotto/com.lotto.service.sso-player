import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { RoleService } from "./role.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("RoleService", () => {
  let service: RoleService;
  let _prismaService: PrismaService;
  const mockCorrelationId = "test-correlation-id";

  const mockPrismaService = {
    role: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
    },
    rolePermission: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  describe("createRole", () => {
    it("should create a role successfully", async () => {
      const roleData = { name: "test-role", description: "test description" };
      mockPrismaService.role.findUnique.mockResolvedValue(null);
      mockPrismaService.role.create.mockResolvedValue(roleData);

      const result = await service.createRole(roleData, mockCorrelationId);

      expect(result).toEqual(roleData);
      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { name: roleData.name },
      });
      expect(mockPrismaService.role.create).toHaveBeenCalledWith({
        data: roleData,
      });
    });

    it("should throw ConflictException if role already exists", async () => {
      const roleData = { name: "test-role", description: "test description" };
      mockPrismaService.role.findUnique.mockResolvedValue(roleData);

      await expect(
        service.createRole(roleData, mockCorrelationId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("assignPermissions", () => {
    const roleId = "test-role-id";
    const permissionIds = ["perm1", "perm2"];

    it("should assign permissions successfully", async () => {
      mockPrismaService.role.findUnique.mockResolvedValue({ id: roleId });
      mockPrismaService.permission.findMany.mockResolvedValue(
        permissionIds.map((id) => ({ id })),
      );
      mockPrismaService.role.findUnique.mockResolvedValue({
        id: roleId,
        permissions: [],
      });

      await service.assignPermissions(
        roleId,
        {
          permission_ids: permissionIds,
        },
        mockCorrelationId,
      );

      expect(mockPrismaService.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId },
      });
      expect(mockPrismaService.rolePermission.createMany).toHaveBeenCalledWith({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    });

    it("should throw NotFoundException if role does not exist", async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(
        service.assignPermissions(
          roleId,
          { permission_ids: permissionIds },
          mockCorrelationId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("should handle errors when assigning permissions", async () => {
      const roleId = "1";
      const permissionIds = ["1", "2", "3"];
      const error = new Error("Test error");

      mockPrismaService.rolePermission.createMany.mockRejectedValueOnce(error);

      await expect(
        service.assignPermissions(
          roleId,
          { permission_ids: permissionIds },
          mockCorrelationId,
        ),
      ).rejects.toThrow(error);
    });
  });
});
