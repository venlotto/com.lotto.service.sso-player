import {Body, Controller, Get, InternalServerErrorException, Logger, Post, Put, Req, UseGuards} from "@nestjs/common";
import {AuthService} from "../../auth/services/auth.service";
import {NewUserDto} from "../dto/new-user.dto";
import {NewUserHandler} from "../handler/new-user.handler";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import { User } from "../model/user.model";

@ApiTags('User')
@Controller({
  version: '1',
})
export class NewUserController {
    public constructor(
        private readonly handler: NewUserHandler,
        private readonly authService: AuthService,
        private readonly logger: Logger = new Logger(NewUserController.name),
    ) {
    }

    @ApiResponse({
        status: 201,
        description: 'Create new user',
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
    @Post("new-user")
    public async new(@Body() newUserDto: NewUserDto): Promise<any> {
        this.logger.log(NewUserController.name, "NewUser");

        let user = null;
        try {
            user = await this.handler.handle(newUserDto);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }

        const userPayload = await User.toPayload(user);
        //console.log(await this.authService.generateRefreshToken(userPayload))
        return {
            'user_id': user.id,
            'access_token': await this.authService.generateAccessToken(userPayload),
            'refresh_token': await this.authService.generateRefreshToken(userPayload),
        }
    }
}