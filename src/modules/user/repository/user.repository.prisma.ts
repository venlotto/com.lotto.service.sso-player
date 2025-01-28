import { Injectable, Logger } from "@nestjs/common";

import { IUserRepository } from "./user.repository.interface";
import { mapEnum } from "../../../common/enum/utils.enum";
import { PrismaService } from "../../prisma/prisma.service";
import { UserStatus } from "../model/enum/user-status.enum";
import { User } from "../model/user.model";

@Injectable()
export class UserRepositoryPrisma implements IUserRepository {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger = new Logger(UserRepositoryPrisma.name),
  ) {}

  public async findById(id: string): Promise<User | null> {
    this.logger.log("UserRepository::findById", { id });

    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) return null;

    return User.fromRepository(
      user.id,
      user.password,
      user.username,
      user.role?.name || null,
      mapEnum(UserStatus, user.status),
      user.last_login,
      user.created_at,
      user.updated_at,
    );
  }

  public async findByUsername(username: string): Promise<User | null> {
    this.logger.log("UserRepository::findByUsername", { username });

    const user = await this.prismaService.user.findUnique({
      where: { username },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return User.fromRepository(
      user.id,
      user.password,
      user.username,
      user.role?.name || null,
      user.status as UserStatus,
      user.last_login,
      user.created_at,
      user.updated_at,
    );
  }

  public async findByCriteria(criteria: any): Promise<User[] | null> {
    this.logger.log("UserRepository::findByCriteria", { criteria });

    const users = await this.prismaService.user.findMany({
      where: criteria,
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!users || users.length === 0) {
      return null;
    }

    return users.map((user) =>
      User.fromRepository(
        user.id,
        user.password,
        user.username,
        user.role?.name || null,
        user.status as UserStatus,
        user.last_login,
        user.created_at,
        user.updated_at,
      ),
    );
  }

  public async save(user: User): Promise<User> {
    this.logger.log("UserRepository::save", { user });

    const savedUser = await this.prismaService.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        username: user.username,
        password: user.password,
        status: user.status,
        last_login: user.lastLogin,
        ...(user.roleName && {
          role: {
            connect: {
              name: user.roleName,
            },
          },
        }),
      },
      update: {
        username: user.username,
        password: user.password,
        status: user.status,
        last_login: user.lastLogin,
        ...(user.roleName && {
          role: {
            connect: {
              name: user.roleName,
            },
          },
        }),
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return User.fromRepository(
      savedUser.id,
      savedUser.password,
      savedUser.username,
      savedUser.role?.name || null,
      mapEnum(UserStatus, savedUser.status),
      savedUser.last_login,
      savedUser.created_at,
      savedUser.updated_at,
    );
  }

  public async updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    this.logger.log("UserRepository::updatePassword", { userId });
    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  public async updateStatus(userId: string, status: UserStatus): Promise<User> {
    this.logger.log("UserRepository::updateStatus", { userId, status });
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { status },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return User.fromRepository(
      updatedUser.id,
      updatedUser.password,
      updatedUser.username,
      updatedUser.role?.name || null,
      status,
      updatedUser.last_login,
      updatedUser.created_at,
      updatedUser.updated_at,
    );
  }
}
