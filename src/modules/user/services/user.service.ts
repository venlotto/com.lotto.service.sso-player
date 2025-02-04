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
import { ListUsersResponseDto } from "../dto/list-users-response.dto";

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
      this.logger.warn("Username already exists", { username, correlationId });
      throw new ConflictException({
        message: "Username already exists",
        error: "ConflictException",
        status_code: 409,
        meta: {
          correlation_id: correlationId,
        }
      });
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

  async assignRole(userId: string, roleIds: string[], correlationId: string): Promise<{ user_id: string; roles: Array<{ role_id: string; name: string }> }> {
    this.logger.log("Assigning roles to user", { correlationId, userId, roleIds });

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        message: "User not found",
        error: "Not Found",
        correlation_id: correlationId,
      });
    }

    // First verify all roles exist
    const existingRoles = await this.prisma.roles.findMany({
      where: { id: { in: roleIds } },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    const foundRoleIds = existingRoles.map(r => r.id);
    const nonExistentRoles = roleIds.filter(id => !foundRoleIds.includes(id));

    if (nonExistentRoles.length > 0) {
      throw new NotFoundException({
        message: `Roles not found: ${nonExistentRoles.join(', ')}`,
        error: "Not Found",
        correlation_id: correlationId,
      });
    }

    // Process each role
    for (const role of existingRoles) {
      // Skip if user already has this role
      if (user.roleNames.includes(role.name)) {
        this.logger.log("User already has this role, skipping", { correlationId, userId, roleName: role.name });
        continue;
      }

      // Add the new role and its permissions to the user
      user.addRole(role.name, role.permissions.map(p => p.permission.id));
    }

    // Save the user
    await this.userRepository.save(user);

    // Get updated user with roles
    const updatedUser = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Return only the necessary data
    return {
      user_id: userId,
      roles: updatedUser.roles.map(r => ({
        role_id: r.role.id,
        name: r.role.name
      }))
    };
  }

  async getUserDetails(userId: string): Promise<{
    id: string;
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
      id: user.id,
      username: user.username,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      last_login: user.lastLogin instanceof Date ? user.lastLogin : null,
    };
  }

  async listUsers(page: number = 1, limit: number = 50): Promise<ListUsersResponseDto> {
    this.logger.log("Listing users with pagination", { page, limit });

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count of users
    const totalCount = await this.prisma.users.count();

    // Get paginated users with their roles and permissions
    const users = await this.prisma.users.findMany({
      skip,
      take: limit,
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform the users into the response format
    const userDetails = users.map(user => ({
      id: user.id,
      username: user.username,
      status: user.status as UserStatus,
      roles: user.roles.map(ur => ur.role.name),
      permissions: user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission.name)
      ),
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    return {
      data: userDetails,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    };
  }

  async removeRoles(userId: string, roleIds: string[], correlationId: string): Promise<any> {
    this.logger.log("Removing roles from user", { correlationId, userId });

    // Check if user exists
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException({
        message: "User not found",
        error: "Not Found",
        correlation_id: correlationId,
      });
    }

    // Remove user-role associations
    await this.prisma.users_roles.deleteMany({
      where: {
        user_id: userId,
        role_id: {
          in: roleIds
        }
      }
    });

    // Get updated user with roles
    const updatedUser = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return {
      user_id: userId,
      roles: updatedUser.roles.map(r => ({
        role_id: r.role.id,
        name: r.role.name
      }))
    };
  }
}
