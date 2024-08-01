import {Prisma} from "@prisma/client";


export class RefreshToken implements Prisma.RefreshTokenCreateInput {
    expiresAt: Date | string;
    token: string;
    userId: string;

    public constructor(expiresAt: Date | string, token: string, userId: string) {
        this.expiresAt = expiresAt;
        this.token = token;
        this.userId = userId;
    }
}
