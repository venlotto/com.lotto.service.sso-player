import {JwtService} from "@nestjs/jwt";
import {PrismaService} from "../../../common/services/prisma.service";
import {Injectable, Logger, NotFoundException, UnauthorizedException} from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import {User} from "../model/user.model";
import * as process from "node:process";

@Injectable()
export class AuthService {
    public constructor(
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly logger: Logger = new Logger(AuthService.name),
    ) {
    }

    public async validateUser(username: string, password: string): Promise<any> {
        const user = await this.prismaService.user.findUnique({
            where: {
                username:username
            }
        });
        if (user && await bcrypt.compare(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    public async login(user: any) {
        const userExists = await this.prismaService.user.findUnique({
            where: {
                username: user.username,
            }
        });

        const payload = {
            username: user.username,
            sub: user.id,
            email: userExists.email,
            name: userExists.name,
            lastLogin: userExists.lastLogin,
        };

        await this.prismaService.user.update({
            where: {
                username: payload.username,
            },
            data: {
                lastLogin: new Date(),
            },

        });

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    public async register(user: User): Promise<any> {
        const hashedPassword: string = await bcrypt.hash(user.password, 10);
        return this.prismaService.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: hashedPassword,
                username: user.username,
            },
        });
    }

    public async findByCriteria(criteria: any) {
        return this.prismaService.user.findMany({
            where: {
                OR: criteria.OR,
            },
        });
    }
}