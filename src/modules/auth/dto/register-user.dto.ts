import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class RegisterUserDto {
  @ApiProperty({
    description: "Phone number for the new player",
    required: true,
  })
  @IsNotEmpty({ message: "phone is required" })
  @IsString()
  @Matches(/^\+?[0-9\s-]{6,19}$/, {
    message: "phone must be a valid phone number",
  })
  readonly phone: string;

  @ApiProperty({
    description: "Password for the new player (min 4 characters)",
    required: true,
  })
  @IsNotEmpty({ message: "password is required" })
  @IsString()
  @MinLength(4, { message: "password must be at least 4 characters" })
  readonly password: string;
}
