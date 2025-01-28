import * as crypto from "crypto";

import {
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { UUID } from "../../../common/value-object/uuid.value-object";
import { UserStatus } from "../../user/model/enum/user-status.enum";
import { User } from "../../user/model/user.model";
import { IUserRepository } from "../../user/repository/user.repository.interface";
import { LoginUserDto } from "../dto/login-user.dto";
import { RefreshToken } from "../model/refresh-token.model";
import { RefreshTokenRepository } from "../repository/refresh-token.repository";

interface TokenPayload {
  sub: string;
  username: string;
  role: string | null;
  [key: string]: unknown;
}

interface LoginResponse {
  user_id: string;
  username: string;
  access_token: string;
  refresh_token: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  public constructor(
    private readonly jwtService: JwtService,
    @Inject("UserRepository") private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  public async validateUser(username: string, password: string): Promise<User> {
    this.logger.log("AuthService::validateUser", { username: username });

    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("User is not active");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return user;
  }

  public async login(loginUserDto: LoginUserDto): Promise<LoginResponse> {
    this.logger.log("AuthService::login - Starting login process", {
      username: loginUserDto.username,
      providedPassword: loginUserDto.password,
    });

    const user = await this.userRepository.findByUsername(
      loginUserDto.username,
    );

    if (!user) {
      this.logger.error("User not found:", loginUserDto.username);
      throw new UnauthorizedException("Invalid login credentials");
    }

    this.logger.log("Found user:", {
      id: user.id,
      username: user.username,
      status: user.status,
      storedPassword: user.password,
    });

    if (user.status === UserStatus.BLOCKED) {
      this.logger.error(
        "AuthService::login",
        { username: loginUserDto.username },
        "User is not active",
      );
      throw new UnauthorizedException("User is not active");
    }

    this.logger.log("Comparing passwords:", {
      provided: loginUserDto.password,
      stored: user.password,
    });

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    this.logger.log("Password validation result:", isPasswordValid);

    if (!isPasswordValid) {
      this.logger.error("Invalid password for user:", loginUserDto.username);
      throw new UnauthorizedException("Invalid login credentials");
    }

    // Update last login time
    user.updateLastLogin();
    await this.userRepository.save(user);

    const payload = User.toPayload(user);

    return {
      user_id: user.id,
      username: user.username,
      access_token: await this.generateAccessToken(payload),
      refresh_token: await this.generateRefreshToken(payload),
    };
  }

  public async generateAccessToken(payload: TokenPayload): Promise<string> {
    this.logger.log("AuthService::generateAccessToken", { payload: payload });
    const expiration = this.configService.get<string>("JWT_EXPIRATION") || "1h";
    return this.jwtService.sign(payload, { expiresIn: expiration });
  }

  public async generateRefreshToken(payload: TokenPayload): Promise<string> {
    this.logger.log("AuthService::generateRefreshToken", { payload: payload });

    const refreshToken = new RefreshToken(
      crypto.randomUUID(),
      payload.sub,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    );

    await this.refreshTokenRepository.create(refreshToken);

    return refreshToken.token;
  }

  public async findRefreshToken(token: string): Promise<RefreshToken | null> {
    this.logger.log("AuthService::findRefreshToken");
    return this.refreshTokenRepository.findByToken(token);
  }

  public async revokeRefreshToken(token: string): Promise<void> {
    this.logger.log("AuthService::revokeRefreshToken");
    await this.refreshTokenRepository.revokeRefreshToken(token);
  }

  public async refreshToken(userId: UUID): Promise<TokenResponse> {
    this.logger.log(AuthService.name + "::refreshToken");

    const user = await this.userRepository.findById(userId.toString());
    if (user.status === UserStatus.BLOCKED) {
      this.logger.error(
        "AuthService::login",
        { username: user.username },
        "User is not active",
      );
      throw new UnauthorizedException("User is not active");
    }

    const payload = User.toPayload(user);

    return {
      access_token: await this.generateAccessToken(payload),
      refresh_token: await this.generateRefreshToken(payload),
    };
  }
}
