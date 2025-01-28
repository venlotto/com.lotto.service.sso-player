import { Injectable, Logger } from "@nestjs/common";

import { IRefreshTokenRepository } from "./refresh-token.repository.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { RefreshToken } from "../model/refresh-token.model";

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger = new Logger(RefreshTokenRepository.name),
  ) {}

  public async create(refreshToken: RefreshToken): Promise<void> {
    this.logger.log("RefreshTokenRepository::create", { refreshToken });

    await this.prismaService.refresh_token.create({
      data: {
        token: refreshToken.token,
        expires_at: refreshToken.expires_at,
        user_id: refreshToken.userId,
      },
    });
  }

  public async findByToken(token: string): Promise<RefreshToken | null> {
    this.logger.log("RefreshTokenRepository::findByToken", { token });

    const foundToken = await this.prismaService.refresh_token.findFirst({
      where: { token },
    });

    return foundToken
      ? new RefreshToken(
          foundToken.token,
          foundToken.user_id,
          foundToken.expires_at,
        )
      : null;
  }

  public async revokeRefreshToken(token: string): Promise<void> {
    this.logger.log("RefreshTokenRepository::revokeRefreshToken", { token });

    await this.prismaService.refresh_token.delete({
      where: { token },
    });
  }
}
