import {AuthService} from "../services/auth.service";
import {BadRequestException, Injectable, Logger} from "@nestjs/common";
import {RegisterUserDto} from "../dto/register-user.dto";
import {User} from "../model/user.model";

@Injectable()
export class RegisterUserHandler {
    public constructor(
        private readonly authService: AuthService,
        private readonly logger: Logger = new Logger(RegisterUserHandler.name)
    ) {
    }

    public async handle(request: RegisterUserDto): Promise<any> {
        this.logger.log(RegisterUserHandler.name);

        const existingUser = await this.authService.findByCriteria({
            OR: [{ email: request.email }, { username: request.username }],
        });

        if (existingUser.length > 0) {
            const conflictingField = existingUser[0].email === request.email ? 'email' : 'username';
            const errorMessage = `User already registered with ${conflictingField} given`;
            this.logger.error(errorMessage);
            throw new BadRequestException({code: 400, message: errorMessage});
        }

        try {
            const dto: User = new User(request);
            const user = await this.authService.register(dto);
            return user.id;
        } catch (error) {
            this.logger.error(error);
            throw Error(error.message);
        }
    }
}
