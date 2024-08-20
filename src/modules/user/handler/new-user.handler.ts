import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { NewUserDto } from "../dto/new-user.dto";
import { User } from "../model/user.model";
import { UserRoles } from "../model/enum/user-roles.enum";
import { UserRepository } from "../repository/user.repository.interface";

@Injectable()
export class NewUserHandler {
    public constructor(
        @Inject(UserRepository) private readonly userRepository: UserRepository,
        private readonly logger: Logger = new Logger(NewUserHandler.name)
    ) {}

    public async handle(newUserDto: NewUserDto): Promise<any> {
        this.logger.log(NewUserHandler.name, "handle");
        const criteria = [{ phone: newUserDto.phone }, { identification: newUserDto.identification }];

        if (await this.userRepository.findByCriteria(criteria)) {
            const errorMessage = `Request cannot be completed`;
            this.logger.error(errorMessage);
            throw new ConflictException(errorMessage);
        }

        try {
            const newUser = await User.newUser(
                null,
                null,
                newUserDto.password,
                newUserDto.username,
                UserRoles.PLAYER,
                newUserDto.identification,
                newUserDto.phone
            );  
            return await this.userRepository.save(newUser);
        } catch (error) {
            this.logger.error(error.message, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }
}
