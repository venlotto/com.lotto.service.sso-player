import { RefreshToken } from "../model/refresh-token.model";

export interface IRefreshTokenRepository {
    create(refreshToken: RefreshToken): Promise<void>;
    findByToken(token: string): Promise<RefreshToken | null>;
    revokeRefreshToken(id: string): Promise<void>;
}
