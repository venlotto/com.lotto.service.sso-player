import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../../common/services/prisma.service";
import { Logger } from "@nestjs/common";
import { User } from "../model/user.model";
export declare class AuthService {
    private readonly jwtService;
    private readonly prismaService;
    private readonly logger;
    constructor(jwtService: JwtService, prismaService: PrismaService, logger?: Logger);
    validateUser(username: string, password: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
    }>;
    register(user: User): Promise<any>;
    findByCriteria(criteria: any): Promise<{
        id: string;
        name: string;
        email: string;
        password: string;
        username: string;
        lastLogin: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
