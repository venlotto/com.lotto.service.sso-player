import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { getJwtSecret } from "../config/env.config";

@Module({
  controllers: [],
  imports: [
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env"],
      expandVariables: true,
    }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: "48h" },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class CommonModule {}
