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

  /**
   * Creates a new user or returns existing one if username already exists
   * @param username The username for the user
   * @param password The password for the user
   * @param correlationId Correlation ID for request tracking
   * @returns The created or existing user
   */
  public async createUser(
    username: string,
    password: string,
    correlationId: string,
  ): Promise<User> {
    this.logger.log("Creating new user", { correlationId, username });

    const existingUser = await this.userRepository.findByUsername(username);
    if (existingUser) {
      this.logger.log("Username already exists, returning existing", { username, correlationId });
      return existingUser;
    }

    // Find the Basic role
    const basicRole = await this.prisma.roles.findUnique({
      where: { name: "Basic" },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!basicRole) {
      this.logger.error("Basic role not found during user creation", { correlationId });
      throw new Error("Basic role not found. System may not be properly bootstrapped.");
    }

    // Create new user with Basic role and active status
    const user = await User.newUser(
      password, // The newUser method will hash the password
      username,
      [basicRole.name], // Now passing an array of role names
      null, // lastLogin
      basicRole.permissions.map(p => p.permission.id)
    );

    // Save the user
    return this.userRepository.save(user);
  }

  async assignRole(userId: string, roleId: string, correlationId: string): Promise<User> {
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

    // Get role with permissions
    const role = await this.roleService.getRoleWithPermissions(roleId, correlationId);
    if (!role) {
      throw new NotFoundException({
        message: "Role not found",
        error: "Not Found",
        correlation_id: correlationId,
      });
    }

    // Check if user already has this role
    if (user.roleNames.includes(role.name)) {
      this.logger.log("User already has this role", { correlationId, userId, roleName: role.name });
      return user;
    }

    // Add the new role and its permissions to the user
    user.addRole(role.name, role.permissions.map(p => p.permission_id));

    // Save and return updated user
    return this.userRepository.save(user);
  }

  async getUserDetails(userId: string): Promise<{
    username: string | null;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
  }> {
    this.logger.log("Getting user details", { userId });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.error("User not found", { userId });
      throw new NotFoundException({
        message: "User not found",
        error: "NotFoundException",
        statusCode: 404,
      });
    }

    return {
      username: user.username,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      last_login: user.lastLogin instanceof Date ? user.lastLogin : null,
    };
  }
}
