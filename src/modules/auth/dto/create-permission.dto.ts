import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class CreatePermissionDto {
  @ApiProperty({ description: "Permission name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Permission description", required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
