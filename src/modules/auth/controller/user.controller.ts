import {Body, Controller, Logger, Post} from "@nestjs/common";
import {AuthService} from "../services/auth.service";
import {RegisterUserDto} from "../dto/register-user.dto";
import {RegisterUserHandler} from "../handler/register-user.handler";
import {ApiResponse, ApiTags} from "@nestjs/swagger";

@Controller('user')
export class UserController {
    public constructor(
        private readonly authService: AuthService,
        private readonly handler: RegisterUserHandler,
        private readonly logger: Logger = new Logger(UserController.name),
    ) {
    }

    @Post('/register')
    @ApiTags('User')
    @ApiResponse({
        status: 201,
        description: 'Register user',
        content: {}
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
    })
    public async register(@Body() body: RegisterUserDto): Promise<any> {
        this.logger.log('UserController.register');

        let userId = null;
        try {
            userId = await this.handler.handle(body);
        } catch (error) {
            throw Error(error);
        }

        return {
            'status': 'OK',
            'userId': userId,
        }
    }
}