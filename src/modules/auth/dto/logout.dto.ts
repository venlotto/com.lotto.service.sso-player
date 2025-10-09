import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LogoutDto {
  @ApiProperty({
    description: "Refresh token to revoke",
    example: "some-refresh-token",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refresh_token?: string;
}
