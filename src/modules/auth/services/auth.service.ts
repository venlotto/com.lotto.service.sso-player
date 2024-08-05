import {JwtService} from "@nestjs/jwt";
import {Injectable, Logger, NotFoundException, UnauthorizedException} from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import {User} from "../model/user.model";
import {UserRepository} from "../repository/user.repository";
import {RefreshToken} from "../model/refresh-token.model";
import {RefreshTokenRepository} from "../repository/refresh-token.repository";
import * as crypto from 'crypto';
import { MailerService } from "./mailer.service";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { EditProfileDto } from "../dto/edit-profile.dto";
import { UserStatus } from "../model/enum/user-status.enum";

@Injectable()
export class AuthService {
    public constructor(
        private readonly jwtService: JwtService,
        private readonly userRepository: UserRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly mailerService: MailerService,
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

        if (userExists.status === UserStatus.INACTIVE || userExists.status === UserStatus.BLOCKED) {
            this.logger.error("AuthService::login", {username: user.username}, 'User is not active');
            throw new UnauthorizedException('User is not active');
        }

        const payload = {
            username: user.username,
            sub: user.id,
            userId: userExists.id,
            email: userExists.email,
            name: userExists.name,
            lastLogin: userExists.lastLogin,
            role: userExists.role,
            status: userExists.status,
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
        this.logger.log('AuthService::revokeRefreshToken');
        await this.refreshTokenRepository.revokeRefreshToken(id)
    }

    public async userExists(criteria: any): Promise<boolean> {
        this.logger.log('AuthService::userExists');
        return await this.userRepository.findByCriteria(criteria);
    }

    public async refreshToken(userId: string): Promise<any> {
        this.logger.log(AuthService.name+'::refreshToken')

        const user = await this.userRepository.findById(userId);
        if (user.status === UserStatus.INACTIVE || user.status === UserStatus.BLOCKED) {
            this.logger.error("AuthService::login", {username: user.username}, 'User is not active');
            throw new UnauthorizedException('User is not active');
        }

        const payload = {
            username: user.username,
            sub: user.id,
            userId: user.id,
            email: user.email,
            name: user.name,
            lastLogin: user.lastLogin,            
            role: user.role,
            status: user.status,
        };

        return {
            'access_token': await this.generateAccessToken(payload),
            'refresh_token': await this.generateRefreshToken(payload),
        };
    }

    public async forgotPassword(email: string): Promise<any> {
        this.logger.log(AuthService.name+'::forgotPassword', email);
        
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User could not be found');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 3600000);
        await this.userRepository.update(user);

        // Send password reset email
        await this.mailerService.sendPasswordResetEmail(user.email, resetToken);
    }

    public async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
        this.logger.log(AuthService.name+'::resetPassword');

        const user = await this.userRepository.findByResetToken(resetPasswordDto.token);
        if (!user) {
            throw new NotFoundException('User could not be found');
        }

        user.password = await bcrypt.hash(resetPasswordDto.password, 10);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await this.userRepository.update(user);

        return {
            message: 'Password reset successful'
        };
    }

    public async getUserProfile(userId: string): Promise<User> {
        this.logger.log(AuthService.name, "getUserProfile");
        return this.userRepository.findById(userId);
    }

    public async updateUserProfile(userId: string, dto: EditProfileDto): Promise<User> {
        this.logger.log(AuthService.name, "updateUserProfile");
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('User could not be found');
        }
        user.email = dto.email;
        user.name = dto.name;
        user.username = dto.username;
        
        return await this.userRepository.update(user);
    }
}