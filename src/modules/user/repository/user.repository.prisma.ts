import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/services/prisma.service";
import { User } from "../model/user.model";
import { UUID } from '../../../common/value-object/uuid.value-object';
import { mapEnum } from '../../../common/enum/utils.enum';
import { UserRoles } from "../model/enum/user-roles.enum";
import { UserStatus } from "../model/enum/user-status.enum";
import { UserRepository } from "./user.repository.interface";

@Injectable()
export class UserRepositoryPrisma implements UserRepository {
    
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly logger: Logger = new Logger(UserRepositoryPrisma.name)
    ) {}

    public async findById(id: UUID): Promise<User | null> {
        this.logger.log("UserRepository::findById", {id: id});
        
        const user = await this.prismaService.user.findUnique({
            where: {
                id: id.toString()
            }
        });

        if (!user) return null;

        return User.fromRepository(
            user.id,
            user.name,
            user.email,
            user.password,
            user.username,
            mapEnum(UserRoles, user.role),
            mapEnum(UserStatus, user.status),
            user.identification,
            user.phone,
            user.last_login
        );
    }

    public async findByUsername(username: string): Promise<User | null> {
        this.logger.log("UserRepository::findByUsername", {username: username});
        
        const user = await this.prismaService.user.findUnique({
            where: {
                username: username
            }
        });

        if (!user) return null;

        return User.fromRepository(
            user.id,
            user.name,
            user.email,
            user.password,
            user.username,
            mapEnum(UserRoles, user.role),
            mapEnum(UserStatus, user.status),
            user.identification,
            user.phone,
            user.last_login
        );
    }

    public async save(user: User): Promise<User> {
        this.logger.log(UserRepositoryPrisma.name + '::save', {user: user});
        
        const upsertedUser = await this.prismaService.user.upsert({
            where: {
                id: user.id.toString(), 
            },
            update: {
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                status: user.status,
                last_login: user.lastLogin,
                password: user.password,
                identification: user.identification,
                phone: user.phone
            },
            create: {
                id: user.id.toString(), 
                name: user.name,
                email: user.email,
                password: user.password,
                username: user.username,
                role: user.role,
                status: user.status,
                last_login: user.lastLogin,
                identification: user.identification,
                phone: user.phone
            },
        });

        return User.fromRepository(
            upsertedUser.id,
            upsertedUser.name,
            upsertedUser.email,
            upsertedUser.password,
            upsertedUser.username,
            mapEnum(UserRoles, upsertedUser.role),
            mapEnum(UserStatus, upsertedUser.status),
            upsertedUser.identification,
            upsertedUser.phone,
            upsertedUser.last_login
        );
    }

    public async findByCriteria(criteria: any[]): Promise<User[] | null> {
        this.logger.log(UserRepositoryPrisma.name, "findByCriteria", {criteria});
        const users = await this.prismaService.user.findMany({
            where: {
                OR: criteria,
            },
        });

        if (users.length === 0) return null;

        return users.map(user => 
            User.fromRepository(
                user.id,
                user.name,
                user.email,
                user.password,
                user.username,
                mapEnum(UserRoles, user.role),
                mapEnum(UserStatus, user.status),
                user.identification,
                user.phone,
                user.last_login
            )
        );
    }

    public async findByEmail(email: string): Promise<User | null> {
        this.logger.log("UserRepository::findByEmail", {email: email});
        
        const user = await this.prismaService.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) return null;

        return User.fromRepository(
            user.id,
            user.name,
            user.email,
            user.password,
            user.username,
            mapEnum(UserRoles, user.role),
            mapEnum(UserStatus, user.status),
            user.identification,
            user.phone,
            user.last_login
        );
    }
}
