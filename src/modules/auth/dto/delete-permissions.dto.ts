import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class DeletePermissionsDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "ID of the permission to delete",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  permission_id: string;
}
