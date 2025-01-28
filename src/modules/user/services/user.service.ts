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

@Injectable()
export class UserService {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: IUserRepository,
    private readonly logger: Logger = new Logger(UserService.name),
  ) {}

  async changePassword(
    userId: string,
    currentPassword: string,
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

    this.logger.debug("Found user, validating current password");

    // Validate current password
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

    this.logger.debug("Current password validated, hashing new password");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(userId, hashedPassword);

    this.logger.log("Password changed successfully", { userId });
  }

  async changeStatus(userId: string, status: UserStatus): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.userRepository.updateStatus(userId, status);
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
}
