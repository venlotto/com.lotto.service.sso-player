import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { IUserRepository } from "./user.repository.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { UserStatus } from "../model/enum/user-status.enum";
import { User } from "../model/user.model";
import { phoneLookupCandidates } from "../../../utils/phone";

@Injectable()
export class UserRepositoryPrisma implements IUserRepository {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger = new Logger(UserRepositoryPrisma.name),
  ) {}

  public async findById(id: string): Promise<User | null> {
    this.logger.log("UserRepository::findById", { id });

    const user = await this.prismaService.users.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Collect all permissions from all roles
    const allPermissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );

    return User.fromRepository(
      user.id,
      user.password,
      user.username || "",
      user.roles.map((ur) => ur.role.name),
      user.status as UserStatus,
      user.last_login,
      user.created_at,
      user.updated_at,
      allPermissions,
    );
  }

  /**
   * Resolves a player by phone, tolerating every spelling the column has
   * accumulated.
   *
   * Rows predate normalization, so trying only the canonical form would lock
   * out every already-registered player. Candidates are ordered
   * canonical-first, so a normalized row always wins over a legacy duplicate.
   */
  public async findByPhone(phone: string): Promise<User | null> {
    for (const candidate of phoneLookupCandidates(phone)) {
      const user = await this.findByUsername(candidate);
      if (user) return user;
    }
    return null;
  }

  public async findByUsername(username: string): Promise<User | null> {
    this.logger.log("UserRepository::findByUsername", { username });

    const user = await this.prismaService.users.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Collect all permissions from all roles
    const allPermissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );

    return User.fromRepository(
      user.id,
      user.password,
      user.username || "",
      user.roles.map((ur) => ur.role.name),
      user.status as UserStatus,
      user.last_login,
      user.created_at,
      user.updated_at,
      allPermissions,
    );
  }

  public async findByCriteria(
    criteria: Prisma.usersWhereInput,
  ): Promise<User[] | null> {
    this.logger.log("UserRepository::findByCriteria", { criteria });

    const users = await this.prismaService.users.findMany({
      where: criteria,
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!users.length) {
      return null;
    }

    return users.map((user) => {
      const allPermissions = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name),
      );

      return User.fromRepository(
        user.id,
        user.password,
        user.username || "",
        user.roles.map((ur) => ur.role.name),
        user.status as UserStatus,
        user.last_login,
        user.created_at,
        user.updated_at,
        allPermissions,
      );
    });
  }

  public async save(user: User): Promise<User> {
    this.logger.log("UserRepository::save", { user });

    // First save/update the user
    await this.prismaService.users.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        username: user.username,
        password: user.password,
        status: user.status,
        last_login: user.lastLogin,
      },
      update: {
        username: user.username,
        password: user.password,
        status: user.status,
        last_login: user.lastLogin,
      },
    });

    // Then handle role assignments
    if (user.roleNames.length > 0) {
      // First delete existing roles
      await this.prismaService.users.update({
        where: { id: user.id },
        data: {
          roles: {
            deleteMany: {},
          },
        },
      });

      // Then add new roles
      const roles = await this.prismaService.roles.findMany({
        where: { name: { in: user.roleNames } },
      });

      await this.prismaService.users.update({
        where: { id: user.id },
        data: {
          roles: {
            create: roles.map((role) => ({
              role: {
                connect: { id: role.id },
              },
            })),
          },
        },
      });
    }

    // Fetch the updated user with all relations
    return this.findById(user.id);
  }
}
