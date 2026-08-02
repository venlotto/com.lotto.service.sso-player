import { Prisma } from "@prisma/client";

import { User } from "../model/user.model";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  /**
   * Resolves a player by phone in any historical spelling, preferring the
   * canonical 0-prefixed form. See utils/phone.ts.
   */
  findByPhone(phone: string): Promise<User | null>;
  findByCriteria(criteria: Prisma.usersWhereInput): Promise<User[] | null>;
  save(user: User): Promise<User>;
}
