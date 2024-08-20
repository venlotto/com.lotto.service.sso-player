import { Prisma } from "@prisma/client";


export class RefreshToken implements Prisma.refresh_tokenCreateInput {
    id: number;
    expires_at: Date | string;
    token: string;
    user_id: string;

    public constructor(expiresAt: Date | string, token: string, userId: string) {
        this.expires_at = expiresAt;
        this.token = token;
        this.user_id = userId;
    }
}