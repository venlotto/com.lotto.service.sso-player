import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../auth/repository/user.repository';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/model/user.model';

@Injectable()
export class SeederService {
    constructor(private readonly userRepository: UserRepository, private readonly logger: Logger) {}

    public async seed() {
        const hashedPassword = await bcrypt.hash('adminPassw0rd', 10);
        const user = new User({
            name: 'Admin User',
            email: 'admin@admin.com',
            password: hashedPassword,
            username: 'admin',
            role: 'admin',
            status: 'active',
        });
        await this.userRepository.createUser(user);

        this.logger.log('Admin user created successfully.');
    }
}
