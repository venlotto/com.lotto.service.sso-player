import { PasswordReset } from "../model/password-reset.model";

export interface IPasswordResetRepository {
    create(data: PasswordReset): Promise<PasswordReset>;
    findByToken(token: string): Promise<PasswordReset | null>;
    delete(id: number): Promise<PasswordReset>;
    findByUserId(userId: string): Promise<PasswordReset | null>;
}
