import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

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
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: "48h" },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class CommonModule {}
