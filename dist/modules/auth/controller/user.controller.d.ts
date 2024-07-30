import { Logger } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { RegisterUserDto } from "../dto/register-user.dto";
import { RegisterUserHandler } from "../handler/register-user.handler";
export declare class UserController {
    private readonly authService;
    private readonly handler;
    private readonly logger;
    constructor(authService: AuthService, handler: RegisterUserHandler, logger?: Logger);
    register(body: RegisterUserDto): Promise<any>;
}
