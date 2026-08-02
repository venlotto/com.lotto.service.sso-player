import type { Logger } from "@nestjs/common";
import { UserStatus } from "../model/enum/user-status.enum";
import type { PrismaService } from "../../prisma/prisma.service";
import { UserRepositoryPrisma } from "./user.repository.prisma";

const USER_ID = "550e8400-e29b-41d4-a716-446655440001";

const prismaRow = (username: string | null): Record<string, unknown> => ({
  id: USER_ID,
  password: "hashed",
  username,
  status: "ACTIVE",
  last_login: null,
  created_at: new Date("2026-08-01T00:00:00.000Z"),
  updated_at: new Date("2026-08-01T00:00:00.000Z"),
  roles: [
    {
      role: {
        name: "player",
        permissions: [{ permission: { name: "bingo:card:buy" } }],
      },
    },
  ],
});

const mockPrismaService = {
  users: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  roles: {
    findMany: jest.fn(),
  },
};

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const repository = (): UserRepositoryPrisma =>
  new UserRepositoryPrisma(
    mockPrismaService as unknown as PrismaService,
    mockLogger as unknown as Logger,
  );

describe("UserRepositoryPrisma", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("maps the row to a User, tolerating a null username", async (): Promise<void> => {
      mockPrismaService.users.findUnique.mockResolvedValue(prismaRow(null));

      const user = await repository().findById(USER_ID);

      expect(user?.id).toBe(USER_ID);
      expect(user?.username).toBeNull();
      expect(user?.roleNames).toEqual(["player"]);
      expect(user?.permissions).toEqual(["bingo:card:buy"]);
    });

    it("returns null when the id does not exist", async (): Promise<void> => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(repository().findById(USER_ID)).resolves.toBeNull();
    });
  });

  describe("findByUsername", () => {
    it("maps the row to a User", async (): Promise<void> => {
      mockPrismaService.users.findUnique.mockResolvedValue(
        prismaRow("04141234567"),
      );

      const user = await repository().findByUsername("04141234567");

      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { username: "04141234567" } }),
      );
      expect(user?.username).toBe("04141234567");
      expect(user?.status).toBe(UserStatus.ACTIVE);
    });

    it("returns null when the username does not exist", async (): Promise<void> => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(
        repository().findByUsername("04141234567"),
      ).resolves.toBeNull();
    });
  });

  describe("findByPhone", () => {
    it("normalizes any spelling to the canonical username", async (): Promise<void> => {
      mockPrismaService.users.findUnique.mockResolvedValue(
        prismaRow("04141234567"),
      );

      const user = await repository().findByPhone("+584141234567");

      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { username: "04141234567" } }),
      );
      expect(user?.username).toBe("04141234567");
    });

    it("refuses a value that cannot be a Venezuelan mobile", async (): Promise<void> => {
      await expect(repository().findByPhone("not-a-phone")).resolves.toBeNull();
      expect(mockPrismaService.users.findUnique).not.toHaveBeenCalled();
    });
  });
});
