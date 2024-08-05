import {IsEmail, IsNotEmpty, IsOptional, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class EditProfileDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    @IsOptional()
    email: string | null;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    @IsOptional()
    name: string | null;

    @ApiProperty()
    @IsString()
    @IsOptional()
    username: string | null;
}