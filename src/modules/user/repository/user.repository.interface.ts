import { User } from "../model/user.model";
import { UUID } from '../../../common/value-object/uuid.value-object';

export const UserRepository = "UserRepository";

export interface UserRepository {
    findById(id: UUID): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    save(user: User): Promise<User>;
    findByCriteria(criteria: any[]): Promise<User[] | null>;
    findByEmail(email: string): Promise<User | null>;
}
