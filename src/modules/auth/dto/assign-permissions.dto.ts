import { IsArray, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignPermissionsDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "ID of the role to assign permissions to",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  role_id: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: "Array of permission IDs to assign to the role",
    example: ["permission-id-1", "permission-id-2"],
    type: "array",
    items: {
      type: "string",
    },
  })
  permission_ids: string[];
}
