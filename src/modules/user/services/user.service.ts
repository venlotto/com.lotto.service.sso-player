import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { UserStatus } from "../model/enum/user-status.enum";
import { User } from "../model/user.model";
import { IUserRepository } from "../repository/user.repository.interface";
import { RoleService } from "../../auth/services/role.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: IUserRepository,
    private readonly roleService: RoleService,
    private readonly prisma: PrismaService,
    private readonly logger: Logger = new Logger(UserService.name),
  ) {}

  async changePassword(
    userId: string,
    currentPassword: string | null,
    newPassword: string,
  ): Promise<void> {
    this.logger.log("Changing password", { userId });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.error("User not found", { userId });
      throw new NotFoundException({
        message: "User not found",
        error: "NotFoundException",
        status_code: 404,
        meta: {
          correlation_id: "unknown",
        },
      });
    }

    // If currentPassword is provided, validate it (user changing their own password)
    if (currentPassword !== null) {
      this.logger.debug("Validating current password");
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        this.logger.error("Invalid current password", { userId });
        throw new UnauthorizedException({
          message: "Current password is incorrect",
          error: "UnauthorizedException",
          status_code: 401,
          meta: {
            correlation_id: "unknown",
          },
        });
      }
    }

    this.logger.debug("Hashing new password");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password using save
    user.setNewPassword(hashedPassword);
    await this.userRepository.save(user);

    this.logger.log("Password changed successfully", { userId });
  }

  async changeStatus(userId: string, status: UserStatus): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Update status using the domain model methods
    if (status === UserStatus.BLOCKED) {
      user.blockUser();
    } else if (status === UserStatus.ACTIVE) {
      user.activateUser();
    }

    return this.userRepository.save(user);
  }

  public async createUser(
    username: string,
    password: string,
    correlationId: string,
  ): Promise<User> {
    this.logger.log("Creating new user", { username, correlationId });

    const existingUser = await this.userRepository.findByUsername(username);
    if (existingUser) {
      this.logger.error("Username already exists", { username, correlationId });
      throw new ConflictException({
        message: "Username already exists",
        error: "ConflictException",
        status_code: 409,
        meta: {
          correlation_id: correlationId,
        },
      });
    }

    const user = await User.newUser(password, username, null);

    return this.userRepository.save(user);
  }

  async assignRole(userId: string, roleId: string, correlationId: string) {
    this.logger.log("Assigning role to user", { correlationId, userId, roleId });

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        message: "User not found",
        error: "Not Found",
        correlation_id: correlationId,
      });
    }

    // Check if role exists
    const role = await this.roleService.getRoleWithPermissions(roleId, correlationId);
    if (!role) {
      throw new NotFoundException({
        message: "Role not found",
        error: "Not Found",
        correlation_id: correlationId,
      });
    }

    // Update user's role using save
    const updatedUser = User.fromRepository(
      user.id,
      user.password,
      user.username,
      role.name,
      user.status,
      user.lastLogin,
      user.createdAt,
      user.updatedAt,
    );

    await this.userRepository.save(updatedUser);

    return {
      user_id: userId,
      role_id: roleId,
    };
  }
}
