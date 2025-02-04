import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, IsOptional, IsUUID } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    description:
      "ID of the user to change password (optional, only for admins)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Current password (required only when changing own password)",
    example: "CurrentPass123!",
    required: false
  })
  current_password?: string;

  @ApiProperty({
    description:
      "New password (must be 8-50 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character)",
    example: "NewPass123!",
  })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/,
    {
      message:
        "Password must be between 8 and 50 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    },
  )
  new_password: string;
}
