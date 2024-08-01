import {PassportStrategy} from "@nestjs/passport";
import { Strategy } from 'passport-local';
import {Injectable, UnauthorizedException} from "@nestjs/common";
import {AuthService} from "../services/auth.service";
import { Logger } from "@nestjs/common";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    public constructor(
        private readonly authService: AuthService,
        private readonly logger: Logger
    ) {
        super();
    }

    public async validate(username: string, password: string): Promise<any> {
        this.logger.log("validate", username);
        const user = await this.authService.validateUser(username, password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}
