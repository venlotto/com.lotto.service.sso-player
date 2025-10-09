import { User } from "../model/user.model";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByCriteria(criteria: any): Promise<User[] | null>;
  save(user: User): Promise<User>;
}
