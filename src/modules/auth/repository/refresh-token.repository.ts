import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/services/prisma.service";
import { RefreshToken } from "../model/refresh-token.model";
import { IRefreshTokenRepository } from "./refresh-token.repository.interface";

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly logger: Logger = new Logger(RefreshTokenRepository.name)
    ) {}

    public async create(refreshToken: RefreshToken): Promise<void> {
        this.logger.log('RefreshTokenRepository::create', { refreshToken });

        await this.prismaService.refresh_token.create({
            data: {
                token: refreshToken.token,
                user_id: refreshToken.user_id,
                expires_at: refreshToken.expires_at,
            },
        });
    }

    public async findByToken(token: string): Promise<RefreshToken | null> {
        this.logger.log('RefreshTokenRepository::findByToken', { token });

        const foundToken = await this.prismaService.refresh_token.findFirst({
            where: { token },
        });

        return foundToken
            ? new RefreshToken(foundToken.expires_at, foundToken.token, foundToken.user_id)
            : null;
    }

    public async revokeRefreshToken(token: string): Promise<void> {
        this.logger.log('RefreshTokenRepository::revokeRefreshToken', { token });

        await this.prismaService.refresh_token.delete({
            where: { token },
        });
    }
}
