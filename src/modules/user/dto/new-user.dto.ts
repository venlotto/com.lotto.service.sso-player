import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class NewUserDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/,
    {
      message:
        "Password must be between 8 and 50 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    },
  )
  password: string;
}
