import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class DeleteRoleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "ID of the role to delete",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  role_id: string;
}
