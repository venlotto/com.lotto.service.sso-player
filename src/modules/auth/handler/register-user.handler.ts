import {AuthService} from "../services/auth.service";
import {BadRequestException, Injectable, Logger} from "@nestjs/common";
import {RegisterUserDto} from "../dto/register-user.dto";
import {User} from "../model/user.model";
import { UserStatus } from "../model/enum/user-status.enum";


@Injectable()
export class RegisterUserHandler {
    public constructor(
        private readonly authService: AuthService,
        private readonly logger: Logger = new Logger(RegisterUserHandler.name)
    ) {
    }

    public async handle(request: RegisterUserDto): Promise<any> {
        this.logger.log(RegisterUserHandler.name, "handle");

        const criteria = [{ email: request.email }, { username: request.username }]
        if (await this.authService.userExists(criteria)) {
            const errorMessage = `User already registered`;
            this.logger.error(errorMessage);
            throw new BadRequestException({code: 400, message: errorMessage});
        }

        try {
            request.status = UserStatus.ACTIVE;
            const dto: User = new User(request);
            const user = await this.authService.register(dto);
            return user.id;
        } catch (error) {
            this.logger.error(error);
            throw Error(error.message);
        }
    }
}
