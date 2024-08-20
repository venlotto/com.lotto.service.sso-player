import {Body, Controller, Logger, LoggerService, Post, UnauthorizedException, UseGuards} from "@nestjs/common";
import {AuthService} from "../services/auth.service";
import {LocalAuthGuard} from "../guards/local-auth.guard";
import * as process from "node:process";
import {ApiTags} from "@nestjs/swagger";
import {LoginUserDto} from "../dto/login-user.dto";
import {RefreshTokenDto} from "../dto/refresh-token.dto";
import { UUID } from "src/common/value-object/uuid.value-object";

@ApiTags('Auth')
@Controller({
    version: '1',
  })
  export class AuthController {
    public constructor(
        private readonly authService: AuthService,
        private readonly logger: Logger = new Logger(AuthController.name)
    ) {
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    public async login(@Body() dto: LoginUserDto): Promise<any> {
        this.logger.log('Login attempt');
        const login = await this.authService.login(dto);

        return {
            access_token: login.access_token,
            expires_in: process.env.JWT_EXPIRES,
            refresh_token: login.refresh_token,
        }
    }

    @Post('refresh-token')
    public async refresh(@Body() dto: RefreshTokenDto): Promise<any> {
        this.logger.log('Refreshing token');

        const refreshToken = await this.authService.findRefreshToken(dto.refresh_token);
        
        if (!refreshToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const currentTime = new Date().getTime();
        const expiresAt = new Date(refreshToken.expires_at).getTime();
        if (expiresAt < currentTime) {
            await this.authService.revokeRefreshToken(refreshToken.id);
            throw new UnauthorizedException('Refresh token expired');
        }

        // Generate new access token
        const refresh = await this.authService.refreshToken(new UUID(refreshToken.user_id));

        return {
            access_token: refresh.access_token,
            expires_in: process.env.JWT_EXPIRES,
            refresh_token: refresh.refresh_token,
        };
    }
}