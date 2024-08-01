import {JwtService} from "@nestjs/jwt";
import {Injectable, Logger} from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import {User} from "../model/user.model";
import {UserRepository} from "../repository/user.repository";
import {RefreshToken} from "../model/refresh-token.model";
import {RefreshTokenRepository} from "../repository/refresh-token.repository";
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    public constructor(
        private readonly jwtService: JwtService,
        private readonly userRepository: UserRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly logger: Logger = new Logger(AuthService.name),
    ) {
    }

    public async validateUser(username: string, password: string): Promise<any> {
        this.logger.log(AuthService.name, "validateUser", username);
        const user: User = await this.userRepository.findByUsername(username);
        if (user && await bcrypt.compare(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    public async login(user: any) {
        this.logger.log("AuthService::login", {username: user.username});
        const username = user.username;
        const userExists = await this.userRepository.findByUsername(username);

        const payload = {
            username: user.username,
            sub: user.id,
            userId: userExists.id,
            email: userExists.email,
            name: userExists.name,
            lastLogin: userExists.lastLogin,
        };

        await this.userRepository.updateLastLogin(userExists);

        return {
            'access_token': await this.generateAccessToken(payload),
            'refresh_token': await this.generateRefreshToken(payload),
        };
    }

    public async generateAccessToken(payload: any): Promise<any> {
        return this.jwtService.sign(payload);
    }

    public async register(user: User): Promise<any> {
        this.logger.log(AuthService.name, `Registering user ${user.username}`);
        user.password = await bcrypt.hash(user.password, 10);
        return this.userRepository.createUser(user);
    }

    public async generateRefreshToken(payload: any) {
        this.logger.log('AuthService::generateRefreshToken', {username: payload.username});

        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setTime(expiresAt.getTime() + parseInt(process.env.REFRESH_EXPIRES, 10) * 1000);

        const refreshToken = new RefreshToken(
            expiresAt,
            token,
            payload.userId
        );

        await this.refreshTokenRepository.create(refreshToken);

        return token;
    }

    public async findRefreshToken(token: string) {
        this.logger.log('AuthService::findRefreshToken');
        return this.refreshTokenRepository.findByToken(token);
    }

    public async revokeRefreshToken(id: number): Promise<any> {
        await this.refreshTokenRepository.revokeRefreshToken(id)
    }

    public async userExists(criteria: any): Promise<boolean> {
        return await this.userRepository.findByCriteria(criteria);
    }

    public async refreshToken(userId: string): Promise<any> {
        this.logger.log(AuthService.name+'::refreshToken')

        const user = await this.userRepository.findById(userId);
        const payload = {
            username: user.username,
            sub: user.id,
            userId: user.id,
            email: user.email,
            name: user.name,
            lastLogin: user.lastLogin,
        };

        return {
            'access_token': await this.generateAccessToken(payload),
            'refresh_token': await this.generateRefreshToken(payload),
        };
    }
}