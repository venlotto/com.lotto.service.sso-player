import {IsNotEmpty, IsStrongPassword, MaxLength} from "class-validator";
import {Match} from "../../../core/decorators/custom.decorator";
import {ApiProperty} from "@nestjs/swagger";

export class ResetPasswordDto {
    @ApiProperty()
    @IsNotEmpty()
    token: string;
    
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
    password: string;
    
    @ApiProperty()
    @IsNotEmpty()
    @Match('password', { message: 'Password confirmation must match password' })
    readonly passwordConfirmation: string;
}
