import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsUUID } from "class-validator";

import { UserStatus } from "../model/enum/user-status.enum";

export class ChangeStatusDto {
  @ApiProperty({
    description: "ID of the user to change status",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: "New status for the user",
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
