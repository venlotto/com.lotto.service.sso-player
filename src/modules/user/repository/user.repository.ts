import { UserStatus } from "../model/enum/user-status.enum";
import { User } from "../model/user.model";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  save(user: User): Promise<User>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  updateStatus(userId: string, status: UserStatus): Promise<User>;
}
