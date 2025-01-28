import { Injectable, Logger } from "@nestjs/common";

import { IRefreshTokenRepository } from "./refresh-token.repository.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { RefreshToken } from "../model/refresh-token.model";

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger = new Logger(RefreshTokenRepository.name),
  ) {}

  public async save(refreshToken: RefreshToken): Promise<void> {
    this.logger.log("RefreshTokenRepository::save");

    await this.prismaService.refresh_tokens.create({
      data: {
        token: refreshToken.token,
        user_id: refreshToken.userId,
        expires_at: refreshToken.expires_at,
      },
    });
  }

  public async findByToken(token: string): Promise<RefreshToken | null> {
    this.logger.log("RefreshTokenRepository::findByToken");

    const foundToken = await this.prismaService.refresh_tokens.findFirst({
      where: { token },
    });

    if (!foundToken) {
      return null;
    }

    return new RefreshToken(
      foundToken.token,
      foundToken.user_id,
      foundToken.expires_at,
    );
  }

  public async delete(token: string): Promise<void> {
    this.logger.log("RefreshTokenRepository::delete");

    await this.prismaService.refresh_tokens.delete({
      where: { token },
    });
  }
}
