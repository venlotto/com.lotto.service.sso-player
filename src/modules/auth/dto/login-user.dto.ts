import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginUserDto {
  @ApiProperty({
    description: "Username for login",
    required: true,
  })
  @IsNotEmpty({ message: "Username is required" })
  @IsString()
  readonly username: string;

  @ApiProperty({
    description: "Password for login",
    required: true,
  })
  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  readonly password: string;
}
