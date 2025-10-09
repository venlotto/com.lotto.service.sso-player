import * as crypto from "crypto";

import { Prisma, refresh_tokens as RefreshTokenRecord } from "@prisma/client";

interface RefreshTokenProps {
  token: string;
  userId: string;
  expiresAt: Date;
  tokenId?: string;
  familyId?: string;
  createdByIp?: string | null;
  createdByUserAgent?: string | null;
  rotatedAt?: Date | null;
  replacedByTokenId?: string | null;
  revokedAt?: Date | null;
}

export class RefreshToken implements Prisma.refresh_tokensCreateInput {
  id?: number;
  token: string;
  token_id: string;
  family_id: string;
  user_id: string;
  expires_at: Date;
  created_by_ip?: string | null;
  created_by_user_agent?: string | null;
  rotated_at?: Date | null;
  replaced_by_token_id?: string | null;
  revoked_at?: Date | null;

  public constructor(props: RefreshTokenProps) {
    this.token = props.token;
    this.token_id = props.tokenId ?? crypto.randomUUID();
    this.family_id = props.familyId ?? crypto.randomUUID();
    this.user_id = props.userId;
    this.expires_at = props.expiresAt;
    this.created_by_ip = props.createdByIp ?? null;
    this.created_by_user_agent = props.createdByUserAgent ?? null;
    this.rotated_at = props.rotatedAt ?? null;
    this.replaced_by_token_id = props.replacedByTokenId ?? null;
    this.revoked_at = props.revokedAt ?? null;
  }

  public static fromRecord(record: RefreshTokenRecord): RefreshToken {
    return new RefreshToken({
      token: record.token,
      userId: record.user_id,
      expiresAt: record.expires_at,
      tokenId: record.token_id,
      familyId: record.family_id,
      createdByIp: record.created_by_ip,
      createdByUserAgent: record.created_by_user_agent,
      rotatedAt: record.rotated_at,
      replacedByTokenId: record.replaced_by_token_id,
      revokedAt: record.revoked_at,
    });
  }

  public isExpired(referenceDate: Date = new Date()): boolean {
    return referenceDate > this.expires_at;
  }

  public markRotated(replacementTokenId: string): void {
    this.rotated_at = new Date();
    this.replaced_by_token_id = replacementTokenId;
  }

  public revoke(): void {
    this.revoked_at = new Date();
  }

  public get userId(): string {
    return this.user_id;
  }

  public get familyId(): string {
    return this.family_id;
  }

  public get tokenId(): string {
    return this.token_id;
  }
}
