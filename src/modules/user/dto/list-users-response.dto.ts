import { ApiProperty } from "@nestjs/swagger";
import { UserStatus } from "../model/enum/user-status.enum";

export class UserDetailsDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "john.doe" })
  username: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ example: ["admin", "user"] })
  roles: string[];

  @ApiProperty({ example: ["com.lotto.service.sso-internal:user:create"] })
  permissions: string[];

  @ApiProperty({ example: "2024-03-20T10:00:00Z" })
  last_login: Date | null;

  @ApiProperty({ example: "2024-03-20T10:00:00Z" })
  created_at: Date;

  @ApiProperty({ example: "2024-03-20T10:00:00Z" })
  updated_at: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 50 })
  itemsPerPage: number;
}

export class ListUsersResponseDto {
  @ApiProperty({ type: [UserDetailsDto] })
  data: UserDetailsDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
