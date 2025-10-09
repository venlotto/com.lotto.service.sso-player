import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsArray } from "class-validator";

export class AssignRoleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "ID of the user to assign the roles to",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  user_id: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: "Array of role IDs to assign",
    example: [
      "456e7890-f12d-34e5-a678-901234567890",
      "789e0123-f45d-67e8-a901-234567890123",
    ],
    type: [String],
  })
  role_ids: string[];
}
