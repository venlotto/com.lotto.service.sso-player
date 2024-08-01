import {Injectable, Logger} from "@nestjs/common";
import {PrismaService} from "../../../common/services/prisma.service";
import {User} from "../model/user.model";

@Injectable()
export class UserRepository {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly logger: Logger = new Logger(UserRepository.name)
    ) {
    }

    public async findById(id: string): Promise<any> {
        return this.prismaService.user.findUnique({
            where: {
                id: id
            }
        })
    }

    public async findByUsername(username: string): Promise<any> {
        this.logger.log("UserRepository::findByUsername", {username: username});
        return this.prismaService.user.findUnique({
            where: {
                username: username
            }
        });
    }

    public async updateLastLogin(user: User): Promise<any> {
        this.logger.log("UserRepository::updateLastLogin", {username: user.username});
        return this.prismaService.user.update({
            where: {
                username: user.username,
            },
            data: {
                lastLogin: new Date(),
            },
        });
    }

    public async createUser(user: User): Promise<any> {
        this.logger.log(UserRepository.name, "create");
        return this.prismaService.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: user.password,
                username: user.username,
            },
        });
    }

    public async findByCriteria(criteria: any): Promise<any> {
        this.logger.log(UserRepository.name, "findByCriteria", {criteria});
        this.prismaService.user.findMany({
            where: {
                OR: criteria.OR,
            },
        });
    }
}
