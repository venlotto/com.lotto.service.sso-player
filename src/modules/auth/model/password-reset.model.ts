import { Prisma } from "@prisma/client";

export class PasswordReset implements Prisma.PasswordResetCreateInput {
    userId: string;
    resetToken: string;
    resetTokenExpiry: string | Date;
    createdAt?: string | Date | undefined;
    updatedAt?: string | Date | undefined;

    public constructor(data: {userId: string, resetToken: string, resetTokenExpiry: string | Date}) {
        this.userId = data.userId;
        this.resetToken = data.resetToken;
        this.resetTokenExpiry = data.resetTokenExpiry;
    }
}
