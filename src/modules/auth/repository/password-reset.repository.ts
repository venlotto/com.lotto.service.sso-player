import { Injectable } from "@nestjs/common";
import {PrismaService} from "../../../common/services/prisma.service";
import { PasswordReset } from "../model/password-reset.model";

@Injectable()
export class PasswordResetRepository {

    public constructor(private readonly prisma: PrismaService) {}

    public async create(data: PasswordReset): Promise<any> {
        return this.prisma.passwordReset.create({ data });
    }

    public async findByToken(token: string): Promise<any> {
        return this.prisma.passwordReset.findUnique({ where: { resetToken: token } });
    }

    public async delete(id: number): Promise<any> {
        return this.prisma.passwordReset.delete({ where: { id: id } });
    }
    public async findByUserId(userId: string): Promise<any> {
        return this.prisma.passwordReset.findFirst({ where: { userId: userId } });
    }
}
