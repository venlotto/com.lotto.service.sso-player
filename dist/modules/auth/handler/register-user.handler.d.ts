import { AuthService } from "../services/auth.service";
import { Logger } from "@nestjs/common";
import { RegisterUserDto } from "../dto/register-user.dto";
export declare class RegisterUserHandler {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService, logger?: Logger);
    handle(request: RegisterUserDto): Promise<any>;
}
