import {Injectable, Logger} from "@nestjs/common";
import {PrismaService} from "../../../common/services/prisma.service";
import {RefreshToken} from "../model/refresh-token.model";

@Injectable()
export class RefreshTokenRepository {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly logger: Logger = new Logger(RefreshTokenRepository.name)
    ) {
    }

    public async create(refreshToken: RefreshToken): Promise<any> {
        this.logger.log('RefreshTokenRepository::create');
        await this.prismaService.refreshToken.create({
            data: {
                token: refreshToken.token,
                userId: refreshToken.userId,
                expiresAt: refreshToken.expiresAt,
            },
        });
    }

    public async findByToken(token: string): Promise<any> {
        return this.prismaService.refreshToken.findFirst({ where: { token: token } });
    }

    public async revokeRefreshToken(id: number): Promise<any> {
        return this.prismaService.refreshToken.delete({ where: { id: id } });
    }
}