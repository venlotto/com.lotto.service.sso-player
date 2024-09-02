import {JwtService} from "@nestjs/jwt";
import {BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException} from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import {User} from "../../user/model/user.model";
import {UserRepositoryPrisma} from "../../user/repository/user.repository.prisma";
import {RefreshToken} from "../model/refresh-token.model";
import {RefreshTokenRepository} from "../repository/refresh-token.repository";
import * as crypto from 'crypto';
import { MailerService } from "./mailer.service";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { EditProfileDto } from "../dto/edit-profile.dto";
import { UserStatus } from "../../user/model/enum/user-status.enum";
import { PasswordResetRepository } from "../repository/password-reset.repository";
import { PasswordReset } from "../model/password-reset.model";
import { PrismaService } from "src/common/services/prisma.service";
import { UUID } from "src/common/value-object/uuid.value-object";
import { LoginUserDto } from "../dto/login-user.dto";

@Injectable()
export class AuthService {
    public constructor(
        private readonly jwtService: JwtService,
        private readonly userRepository: UserRepositoryPrisma,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly mailerService: MailerService,
        private readonly logger: Logger = new Logger(AuthService.name),
        private readonly passwordResetRepository: PasswordResetRepository,
        private readonly prisma: PrismaService,
    ) {
    }

    public async validateUser(loginDto: LoginUserDto): Promise<any> {
        this.logger.log(AuthService.name, "validateUser", loginDto);
        
        let criteria = [];
    
        // Detect which field is provided and build the search criteria
        if (loginDto.username) {
            criteria = [ { username: loginDto.username } ];
        } else if (loginDto.phone) {
            criteria = [ { phone: loginDto.phone } ];
        } else if (loginDto.identification) {
            criteria = [ { identification: loginDto.identification } ];
        } else {
            throw new BadRequestException('Please provide either username, phone, or identification.');
        }
    
        // Use findByCriteria to search for the user
        const users = await this.userRepository.findByCriteria(criteria);
        
        // Assuming findByCriteria returns an array of users
        if (!users || users.length === 0) {
            throw new UnauthorizedException('Invalid login credentials');
        }
    
        const user = users[0];
    
        if (await bcrypt.compare(loginDto.password, user.password)) {
            const { password, ...result } = user;
            return result;
        } else {
            throw new UnauthorizedException('Invalid password');
        }
    }
    
    

    public async login(loginUserDto: LoginUserDto) {
        this.logger.log("AuthService::login", {username: loginUserDto.username});
       
        let criteria = [];
        if (loginUserDto.identification) {
            criteria = [{ identification: loginUserDto.identification }];
        } else if (loginUserDto.phone) {
            criteria = [{ phone: loginUserDto.phone }];
        } else {
            throw new BadRequestException('Please provide either identification or phone.');
        }
       
        const users = await this.userRepository.findByCriteria(criteria);

        if (!users) {
            throw new UnauthorizedException('Invalid login credentials');
        }

        const user = users[0];

        if (user.status === UserStatus.INACTIVE || user.status === UserStatus.BLOCKED) {
            this.logger.error("AuthService::login", {username: loginUserDto.username}, 'User is not active');
            throw new UnauthorizedException('User is not active');
        }

        await this.userRepository.save(user);

        const payload = {
            username: loginUserDto.username,
            sub: user.id,
            userId: user.id,
            email: user.email,
            name: user.name,
            lastLogin: user.lastLogin,
            role: user.role,
            status: user.status,
        };

        return {
            'user_id': user.id,
            'access_token': await this.generateAccessToken(payload),
            'refresh_token': await this.generateRefreshToken(payload),
        };
    }

    public async generateAccessToken(payload: any): Promise<any> {
        return this.jwtService.sign(payload,{ expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '1h'})
    }

    public async register(user: User): Promise<any> {
        this.logger.log(AuthService.name, `Registering user ${user.username}`);
        return this.userRepository.save(user);
    }

    public async generateRefreshToken(payload: any): Promise<string> {
        this.logger.log('AuthService::generateRefreshToken', { user_id: payload.id });
    
        const token = crypto.randomBytes(64).toString('hex');
    
        const expiresAt = new Date();
        // Parse the expiration time from environment variable in seconds
        const seconds = parseInt(process.env.REFRESH_TOKEN_EXPIRES || '2592000', 10); 
        expiresAt.setTime(expiresAt.getTime() + seconds * 1000);
    
    
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

    public async revokeRefreshToken(token: string): Promise<any> {
        this.logger.log('AuthService::revokeRefreshToken');
        await this.refreshTokenRepository.revokeRefreshToken(token)
    }

    public async userExists(criteria: any): Promise<User[]> {
        this.logger.log('AuthService::userExists');
        return await this.userRepository.findByCriteria(criteria);
    }

    public async refreshToken(userId: UUID): Promise<any> {
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

        const passwordResetExists = await this.passwordResetRepository.findByUserId(user.id);
        if (passwordResetExists && passwordResetExists.reset_token_expiry > new Date()) {
            throw new BadRequestException('Password reset token already requested');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000);

        const passwordReset = new PasswordReset(user.id, resetToken, resetTokenExpiry);
        await this.passwordResetRepository.create(passwordReset);

        // Send password reset email
        await this.mailerService.sendPasswordResetEmail(user.email, resetToken);
    }

    public async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
        this.logger.log(AuthService.name+'::resetPassword');

        const passwordReset = await this.passwordResetRepository.findByToken(resetPasswordDto.token);
        if (!passwordReset) {
            throw new NotFoundException('Password reset token not found');
        }

        let user = await this.userRepository.findById(new UUID(passwordReset.user_id));
        if (!user) {
            throw new NotFoundException('User could not be found');
        }
        user.setNewPassword(resetPasswordDto.password);

        try {
            await this.prisma.$transaction(async (): Promise<void> => {
                console.log('transaction started');
                await this.passwordResetRepository.delete(passwordReset.id);

                await this.userRepository.save(user);
            });
        } catch (error) {
            this.logger.error(AuthService.name+'::resetPassword', error);
            throw new InternalServerErrorException('Error resetting password');
        }

        return {
            message: 'Password reset successful'
        };
    }

    public async getUserProfile(userId: UUID): Promise<User> {
        this.logger.log(AuthService.name, "getUserProfile");
        return this.userRepository.findById(userId);
    }

    public async updateUserProfile(userId: UUID, dto: EditProfileDto): Promise<User> {
        this.logger.log(AuthService.name, "updateUserProfile");
        const userExists = await this.userRepository.findById(userId);
        if (!userExists) {
            throw new NotFoundException('User could not be found');
        }

        const user = User.fromRepository(userId.toString(), dto.email, dto.name, dto.username, userExists.password, userExists.role, userExists.status);
        
        return await this.userRepository.save(user);
    }
}
