import {Logger, Module} from '@nestjs/common';
import {PrismaService} from "../../common/services/prisma.service";
import {UserController} from "./controller/user.controller";
import {AuthService} from "./services/auth.service";
import {RegisterUserHandler} from "./handler/register-user.handler";
import {JwtModule, JwtService} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import * as process from "node:process";
import {AuthController} from "./controller/auth.controller";
import {LocalStrategy} from "./strategies/local.strategy";
import {LocalAuthGuard} from "./guards/local-auth.guard";

@Module({
    controllers: [
        UserController,
        AuthController,
    ],
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || '48da21ccb2abd9a2e756228b42d15fdbe39c00f1',
            signOptions: {expiresIn: process.env.JWT_EXPIRES + 's'},
        }),
    ],
    providers: [
        PrismaService,
        Logger,
        AuthService,
        RegisterUserHandler,
        LocalStrategy,
    ],
})
export class AuthModule {}
