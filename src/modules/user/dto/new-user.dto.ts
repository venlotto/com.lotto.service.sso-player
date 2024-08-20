import {IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword, Length, MaxLength, MinLength, Validate} from "class-validator";
import {Match} from "../../../core/decorators/custom.decorator";
import {ApiProperty} from "@nestjs/swagger";
import { UserRoles } from "../model/enum/user-roles.enum";

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
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 1,
        minUppercase: 1,
    }, {
            message: 'Password must be at least 8 characters'
    })
    @MaxLength(20)
    readonly password: string;

    @ApiProperty()
    @IsNotEmpty()
    @Match('password', { message: 'Password confirmation must match password' })
    readonly passwordConfirmation: string;

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
