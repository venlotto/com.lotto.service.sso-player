import configs from '../config';
import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from 'src/modules/auth/services/auth.service';

@Module({
    controllers: [],
    imports: [
        PassportModule,
        ConfigModule.forRoot({
            load: configs,
            isGlobal: true,
            cache: true,
            envFilePath: ['.env'],
            expandVariables: true,
        }),
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET || '48da21ccb2abd9a2e756228b42d15fdbe39c00f1',
                signOptions: { expiresIn: process.env.JWT_EXPIRES + 's' },
            }),
        }),
    ],
    providers: [
        PrismaService,
    ],
    exports: [PrismaService, JwtModule],
})
export class CommonModule {}
