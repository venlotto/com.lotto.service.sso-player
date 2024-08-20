import {Logger, Module} from '@nestjs/common';
import {PrismaService} from "../../common/services/prisma.service";
import {AuthService} from "./services/auth.service";
import {JwtModule, JwtService} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import * as process from "node:process";
import {AuthController} from "./controller/auth.controller";
import {LocalStrategy} from "./strategies/local.strategy";
import {LocalAuthGuard} from "./guards/local-auth.guard";
import {UserRepositoryPrisma} from "../user/repository/user.repository.prisma";
import {RefreshTokenRepository} from "./repository/refresh-token.repository";
import { MailerService } from './services/mailer.service';
import * as nodemailer from 'nodemailer';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordResetRepository } from './repository/password-reset.repository';
import { UserRepository } from '../user/repository/user.repository.interface';
import { CommonModule } from 'src/common/common.module';

@Module({
    controllers: [
        AuthController,
    ],
    imports: [
        CommonModule,
    ],
    providers: [
        AuthService,
        PrismaService,
        Logger,
        UserRepositoryPrisma,
        RefreshTokenRepository,
        PasswordResetRepository,
        LocalStrategy,
        LocalAuthGuard,
        {
            provide: 'MAILER_TRANSPORTER',
            useFactory: () => {
              return nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: 587,
                secure: false,
                auth: {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASSWORD,
                },
              });
            },
        },
        MailerService,
        JwtAuthGuard,
        {
          provide: UserRepository,
          useClass: UserRepositoryPrisma,
        },
    ],
    exports: [AuthService]
})
export class AuthModule {}
