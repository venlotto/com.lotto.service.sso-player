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
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '48h' },
            }),
        }),
    ],
    providers: [
        PrismaService,
    ],
    exports: [PrismaService, JwtModule],
})
export class CommonModule {}
