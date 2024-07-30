import { Logger } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { LoginUserDto } from "../dto/login-user.dto";
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService, logger?: Logger);
    login(req: LoginUserDto): Promise<any>;
}
