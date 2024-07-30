import {Body, Controller, Logger, LoggerService, Post, UseGuards} from "@nestjs/common";
import {AuthService} from "../services/auth.service";
import {LocalAuthGuard} from "../guards/local-auth.guard";
import * as process from "node:process";
import {ApiTags} from "@nestjs/swagger";
import {LoginUserDto} from "../dto/login-user.dto";


@Controller('auth')
export class AuthController {
    public constructor(
        private readonly authService: AuthService,
        private readonly logger: Logger = new Logger(AuthController.name)
    ) {
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ApiTags('Auth')
    async login(@Body() req: LoginUserDto): Promise<any> {
        this.logger.log('Login attempt');
        const token: {access_token: string} = await this.authService.login(req);

        return {
            access_token: token.access_token,
            expires_in: process.env.JWT_EXPIRES+'s',
        }
    }
}
