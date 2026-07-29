import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from "class-validator";

export class LoginUserDto {
  @ApiProperty({
    description: "Phone number for login",
    required: true,
  })
  @IsNotEmpty({ message: "Phone is required" })
  @IsString()
  @Matches(/^\+?[0-9\s\-]{6,19}$/, {
    message: "phone must be a valid phone number",
  })
  readonly phone: string;

  @ApiProperty({
    description: "Password for login",
    required: true,
  })
  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  readonly password: string;

  @ApiPropertyOptional({
    description:
      "Absolute URL to redirect after login. Must be part of the configured whitelist.",
    example: "https://plus.bingo/web.bingo-reports",
  })
  @IsOptional()
  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: "redirect_uri must be an absolute URL" },
  )
  readonly redirect_uri?: string;

  @ApiPropertyOptional({
    description: "Opaque state value returned untouched on redirect",
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  readonly state?: string;
}
