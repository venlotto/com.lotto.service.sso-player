import { RefreshToken } from "../model/refresh-token.model";

export interface IRefreshTokenRepository {
  save(refreshToken: RefreshToken): Promise<void>;
  findByToken(token: string): Promise<RefreshToken | null>;
  markRotated(tokenId: string, replacementTokenId: string): Promise<void>;
  delete(token: string): Promise<void>;
}
