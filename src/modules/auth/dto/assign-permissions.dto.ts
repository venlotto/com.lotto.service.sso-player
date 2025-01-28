import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class AssignPermissionsDto {
  @ApiProperty({
    description: "Array of permission IDs to assign",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permission_ids: string[];
}
