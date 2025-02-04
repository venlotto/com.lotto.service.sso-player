import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsUUID } from "class-validator";
import { Transform } from "class-transformer";

import { UserStatus } from "../model/enum/user-status.enum";

export class ChangeStatusDto {
  @ApiProperty({
    description: "ID of the user to change status",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: "New status for the user (case-insensitive)",
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  })
  @IsEnum(UserStatus, {
    message: "status must be one of the following values: ACTIVE, BLOCKED (case-insensitive)"
  })
  status: UserStatus;
}
