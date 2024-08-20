import {BadRequestException, Inject, Injectable, Logger} from "@nestjs/common";
import {NewUserDto} from "../dto/new-user.dto";
import {User} from "../model/user.model";
import { UserRoles } from "../model/enum/user-roles.enum";
import { UserRepository } from "../repository/user.repository.interface";

@Injectable()
export class NewUserHandler {
    public constructor(
        
        @Inject(UserRepository) private readonly userRepository: UserRepository,
        private readonly logger: Logger = new Logger(NewUserHandler.name)
    ) {
    }

    public async handle(newUserDto: NewUserDto): Promise<any> {
        this.logger.log(NewUserHandler.name, "handle");

        const criteria = [{ phone: newUserDto.phone }, { identification: newUserDto.identification }]
        // TODO: remove badrequest exception from business logic to controller
        // TODO: exceptions should log automatically the error
        console.log("jefri")
        console.log("jefri")
        console.log("jefri")
        console.log("jefri")
        console.log("jefri")
        console.log("jefri")

        console.log(newUserDto.phone)
        console.log(newUserDto.identification)
        console.log(await this.userRepository.findByCriteria(criteria))
        console.log("sfasfsasafsafasf")
        console.log("sfasfsasafsafasf")
        console.log("sfasfsasafsafasf")
        console.log("sfasfsasafsafasf")
        console.log("sfasfsasafsafasf")
        console.log("sfasfsasafsafasf")
        console.log("sfasfsasafsafasf")
        if (await this.userRepository.findByCriteria(criteria)) {
            const errorMessage = `User already registered`;
            this.logger.error(errorMessage);
            throw new BadRequestException({code: 400, message: 'errorMessage'});
        }

        try {
            const newUser = await User.newUser(
                null,
                null,
                newUserDto.password,
                newUserDto.username,   
                UserRoles.PLAYER,
            );  
            return await this.userRepository.save(newUser)
        } catch (error) {
            this.logger.error(error);
            throw Error(error.message);
        }
    }
}
