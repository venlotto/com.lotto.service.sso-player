import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

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

  @ApiPropertyOptional({
    description:
      "Absolute URL to redirect after registration. Must be part of the configured whitelist.",
    example: "https://plus.bingo/web.bingo-crush",
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
