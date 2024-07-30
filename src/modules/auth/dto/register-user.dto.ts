import {IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length, MaxLength, MinLength, Validate} from "class-validator";
import {Match} from "../../../core/decorators/custom.decorator";
import {ApiProperty} from "@nestjs/swagger";

export class RegisterUserDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @ApiProperty()
    @IsNotEmpty()
    readonly username: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    readonly name: string;

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
}