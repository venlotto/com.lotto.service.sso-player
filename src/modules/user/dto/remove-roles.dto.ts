import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class RemoveRolesDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "ID of the user to remove roles from",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  user_id: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: "Array of role IDs to remove from the user",
    example: ["role-id-1", "role-id-2"],
    type: "array",
    items: {
      type: "string",
    },
  })
  role_ids: string[];
}
