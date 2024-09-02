import {IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword, MaxLength, MinLength} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class NewUserDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    readonly identification?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    readonly name?: string;

    @ApiProperty()
    @IsOptional()
    @IsEmail()
    readonly email: string;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(6, {
        message: 'Password must be between 6 and 16 characters long.'
    })
    @MaxLength(16, {
        message: 'Password must be between 6 and 16 characters long.'
    })
    readonly password: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    readonly username: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @MaxLength(20)
    readonly phone?: string;
}
