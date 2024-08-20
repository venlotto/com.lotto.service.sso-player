import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/services/prisma.service";
import { PasswordReset } from "../model/password-reset.model";
import { IPasswordResetRepository } from "./password-reset.repository.interface";

@Injectable()
export class PasswordResetRepository implements IPasswordResetRepository {
    private readonly logger = new Logger(PasswordResetRepository.name);

    public constructor(private readonly prisma: PrismaService) {}

    public async create(data: PasswordReset): Promise<PasswordReset> {
        this.logger.log('PasswordResetRepository::create', {data});
        return this.prisma.password_reset.create({ data });
    }

    public async findByToken(token: string): Promise<PasswordReset | null> {
        this.logger.log('PasswordResetRepository::findByToken', {token});
        return this.prisma.password_reset.findUnique({ where: { reset_token: token } });
    }

    public async delete(id: number): Promise<PasswordReset> {
        this.logger.log('PasswordResetRepository::delete', {id});
        return this.prisma.password_reset.delete({ where: { id } });
    }

    public async findByUserId(userId: string): Promise<PasswordReset | null> {
        this.logger.log('PasswordResetRepository::findByUserId', {userId});
        return this.prisma.password_reset.findFirst({ where: { user_id: userId } });
    }
}
