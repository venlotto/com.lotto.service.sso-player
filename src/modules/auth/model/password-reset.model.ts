import { Prisma } from "@prisma/client";

export class PasswordReset implements Prisma.password_resetCreateInput {
    id: number;
    user_id: string;
    reset_token: string;
    reset_token_expiry: string | Date;
    created_at?: string | Date | undefined;
    updatedAt?: string | Date | undefined;

    public constructor(userId: string, resetToken: string, resetTokenExpiry: string | Date) {
        this.user_id = userId;
        this.reset_token = resetToken;
        this.reset_token_expiry = resetTokenExpiry;
    }
}
