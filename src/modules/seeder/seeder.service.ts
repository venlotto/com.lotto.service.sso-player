import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/model/user.model';
import { UserRoles } from '../user/model/enum/user-roles.enum';
import { UserStatus } from '../user/model/enum/user-status.enum';
import { UserRepositoryPrisma } from '../user/repository/user.repository.prisma';

@Injectable()
export class SeederService {
    constructor(
        private readonly userRepository: UserRepositoryPrisma,
        private readonly configService: ConfigService,
        private readonly logger: Logger
    ) {}

    public async seed() {
        this.logger.log('Starting seeding process...');

        try {
            const user = await User.newUser(
                this.configService.get<string>('ADMIN_NAME'),
                this.configService.get<string>('ADMIN_EMAIL'),
                this.configService.get<string>('ADMIN_PASSWORD'),
                this.configService.get<string>('ADMIN_USERNAME'),
                UserRoles.ADMIN,
                UserStatus.ACTIVE
            );

            await this.userRepository.save(user);

            this.logger.log('Admin user created successfully.');
        } catch (error) {
            this.logger.error(`Error during seeding process: ${error.message}`);
            throw error;
        }
    }
}