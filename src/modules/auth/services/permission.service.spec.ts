import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { PermissionService } from "./permission.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("PermissionService", () => {
  let service: PermissionService;
  let _prismaService: PrismaService;

  const mockPrismaService = {
    permission: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockCorrelationId = "test-correlation-id";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  describe("createPermission", () => {
    it("should create a permission successfully", async () => {
      const permissionData = {
        name: "test-permission",
        description: "test description",
      };
      mockPrismaService.permission.findUnique.mockResolvedValue(null);
      mockPrismaService.permission.create.mockResolvedValue(permissionData);

      const result = await service.createPermission(
        permissionData,
        mockCorrelationId,
      );

      expect(result).toEqual(permissionData);
      expect(mockPrismaService.permission.findUnique).toHaveBeenCalledWith({
        where: { name: permissionData.name },
      });
      expect(mockPrismaService.permission.create).toHaveBeenCalledWith({
        data: permissionData,
      });
    });

    it("should throw ConflictException if permission already exists", async () => {
      const permissionData = {
        name: "test-permission",
        description: "test description",
      };
      mockPrismaService.permission.findUnique.mockResolvedValue(permissionData);

      await expect(
        service.createPermission(permissionData, mockCorrelationId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("getAllPermissions", () => {
    it("should return all permissions with their roles", async () => {
      const mockPermissions = [
        {
          id: "1",
          name: "test-permission",
          roles: [{ role: { id: "1", name: "test-role" } }],
        },
      ];
      mockPrismaService.permission.findMany.mockResolvedValue(mockPermissions);

      const result = await service.getAllPermissions(mockCorrelationId);

      expect(result).toEqual(mockPermissions);
      expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    });
  });
});
