import { RefreshToken } from "../model/refresh-token.model";

export interface IRefreshTokenRepository {
  save(refreshToken: RefreshToken): Promise<void>;
  findByToken(token: string): Promise<RefreshToken | null>;
  delete(token: string): Promise<void>;
}
