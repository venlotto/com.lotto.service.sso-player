import { Prisma } from "@prisma/client";

export class RefreshToken implements Prisma.refresh_tokensCreateInput {
  id: string;
  expires_at: Date;
  token: string;
  user_id: string;

  public constructor(token: string, userId: string, expiresAt: Date) {
    this.token = token;
    this.user_id = userId;
    this.expires_at = expiresAt;
  }

  public isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  public get userId(): string {
    return this.user_id;
  }
}
