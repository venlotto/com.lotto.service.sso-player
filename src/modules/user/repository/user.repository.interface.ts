import { UserStatus } from "../model/enum/user-status.enum";
import { User } from "../model/user.model";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByCriteria(criteria: any): Promise<User[] | null>;
  save(user: User): Promise<User>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  updateStatus(userId: string, status: UserStatus): Promise<User>;
}
