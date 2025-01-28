import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignRoleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "ID of the user to assign the role to",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  user_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "ID of the role to assign",
    example: "456e7890-f12d-34e5-a678-901234567890",
  })
  role_id: string;
} 