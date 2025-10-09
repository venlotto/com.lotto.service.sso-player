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

  public async save(refreshToken: RefreshToken): Promise<void> {
    this.logger.log("RefreshTokenRepository::save");

    await this.prismaService.refresh_tokens.create({
      data: {
        token: refreshToken.token,
        token_id: refreshToken.tokenId,
        family_id: refreshToken.familyId,
        user_id: refreshToken.userId,
        expires_at: refreshToken.expires_at,
        created_by_ip: refreshToken.created_by_ip ?? undefined,
        created_by_user_agent: refreshToken.created_by_user_agent ?? undefined,
        rotated_at: refreshToken.rotated_at ?? undefined,
        replaced_by_token_id: refreshToken.replaced_by_token_id ?? undefined,
        revoked_at: refreshToken.revoked_at ?? undefined,
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

    return RefreshToken.fromRecord(foundToken);
  }

  public async markRotated(
    tokenId: string,
    replacementTokenId: string,
  ): Promise<void> {
    this.logger.log("RefreshTokenRepository::markRotated");

    await this.prismaService.refresh_tokens.updateMany({
      where: { token_id: tokenId },
      data: {
        rotated_at: new Date(),
        replaced_by_token_id: replacementTokenId,
      },
    });
  }

  public async delete(token: string): Promise<void> {
    this.logger.log("RefreshTokenRepository::delete");

    await this.prismaService.refresh_tokens.updateMany({
      where: { token },
      data: {
        revoked_at: new Date(),
      },
    });
  }
}
