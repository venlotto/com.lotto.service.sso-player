import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterUserDto {
  @ApiProperty({
    description: "Username for the new player",
    required: true,
  })
  @IsNotEmpty({ message: "username must be a string" })
  @IsString()
  readonly username: string;

  @ApiProperty({
    description: "Password for the new player",
    required: true,
  })
  @IsNotEmpty({ message: "password must be a string" })
  @IsString()
  @MinLength(8, { message: "password must be at least 8 characters" })
  readonly password: string;
}
