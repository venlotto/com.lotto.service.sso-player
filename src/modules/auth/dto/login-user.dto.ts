import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
    @ApiProperty({
        description: 'Username for login',
        required: false,
    })
    @ValidateIf(o => !o.phone && !o.identification)
    @IsNotEmpty({ message: 'Username, phone, or identification must be provided' })
    @IsString()
    readonly username?: string;

    @ApiProperty({
        description: 'Phone number for login',
        required: false,
    })
    @ValidateIf(o => !o.username && !o.identification)
    @IsNotEmpty({ message: 'Username, phone, or identification must be provided' })
    @IsString()
    readonly phone?: string;

    @ApiProperty({
        description: 'Identification for login',
        required: false,
    })
    @ValidateIf(o => !o.username && !o.phone)
    @IsNotEmpty({ message: 'Username, phone, or identification must be provided' })
    @IsString()
    readonly identification?: string;

    @ApiProperty({
        description: 'Password for login',
        required: true,
    })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    readonly password: string;
}
