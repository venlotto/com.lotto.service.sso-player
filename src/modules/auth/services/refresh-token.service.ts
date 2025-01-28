import { Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(token: string, userId: string, expiresAt: Date) {
    this.logger.log("Creating refresh token", { userId });
    return this.prisma.refresh_tokens.create({
      data: {
        token,
        user_id: userId,
        expires_at: expiresAt,
      },
    });
  }

  async findByToken(token: string) {
    return this.prisma.refresh_tokens.findUnique({
      where: { token },
    });
  }

  async delete(token: string) {
    return this.prisma.refresh_tokens.delete({
      where: { token },
    });
  }

  async deleteAllForUser(userId: string) {
    return this.prisma.refresh_tokens.deleteMany({
      where: { user_id: userId },
    });
  }
}
