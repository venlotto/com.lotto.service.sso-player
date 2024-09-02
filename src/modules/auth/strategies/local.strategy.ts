import {PassportStrategy} from "@nestjs/passport";
import { Strategy } from 'passport-local';
import {Injectable, UnauthorizedException} from "@nestjs/common";
import {AuthService} from "../services/auth.service";
import { Logger } from "@nestjs/common";
import { LoginUserDto } from "../dto/login-user.dto";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    public constructor(
        private readonly authService: AuthService,
        private readonly logger: Logger
    ) {
        super();
    }

    public async validate(loginUserDto: LoginUserDto): Promise<any> {
        this.logger.log("validate", loginUserDto.username ? loginUserDto.username : loginUserDto.identification);
        // TO DO check if LoginUserDto should be used or username/password
        const user = await this.authService.validateUser(loginUserDto);//, password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}
