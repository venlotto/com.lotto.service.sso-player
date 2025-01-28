import { ApiProperty } from "@nestjs/swagger";

export class Role {
  @ApiProperty({
    description: "Role ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Role name",
    example: "admin",
  })
  name: string;

  @ApiProperty({
    description: "Role description",
    example: "System administrator role",
  })
  description: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-27T19:50:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-27T19:50:00.000Z",
  })
  updatedAt: Date;

  @ApiProperty({
    description: "Role permissions",
    type: "array",
    items: {
      type: "object",
      properties: {
        permission: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
          },
        },
      },
    },
  })
  permissions?: {
    permission: {
      id: string;
      name: string;
      description: string;
    };
  }[];

  constructor(partial: Partial<Role>) {
    Object.assign(this, partial);
  }
}
