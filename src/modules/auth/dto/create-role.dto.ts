import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class CreateRoleDto {
  @ApiProperty({ description: "Role name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Role description", required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
