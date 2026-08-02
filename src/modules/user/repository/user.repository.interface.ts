import type { User } from "../model/user.model";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  /**
   * Resolves a player by phone. Canonical form only — usernames are phone
   * numbers in the 0-prefixed local form and nothing else. See utils/phone.ts.
   */
  findByPhone(phone: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
