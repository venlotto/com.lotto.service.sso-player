import { UserRoles } from './enum/user-roles.enum';
import { UserStatus } from './enum/user-status.enum';
import { UUID } from '../../../common/value-object/uuid.value-object';
import * as bcrypt from 'bcrypt';

export class User {
  private readonly _id: UUID;
  private _name: string | null;
  private _email: string | null;
  private _password: string;
  private _username: string | null;
  private _lastLogin: Date | string | null;
  private _role: UserRoles; 
  private _status: UserStatus;

  public static mapRole(role: string): UserRoles {
    if (!Object.values(UserRoles).includes(role as UserRoles)) {
      throw new Error(`Invalid role: ${role}`);
    }
    return UserRoles[role as keyof typeof UserRoles];
  }

  private constructor(
    id: UUID,
    name: string,
    email: string,
    password: string,
    username: string,
    role: UserRoles, 
    status: UserStatus,
    lastLogin: Date | string | null = null
  ) {
    this._id = id;
    this._name = name || null;
    this._email = email || null;
    this._password = password;
    this._username = username || null;
    this._role = role;
    this._status = status;
    this._lastLogin = lastLogin;
  }

  // Static factory method to create a new user with CREATED status
  public static async newUser(
    name: string,
    email: string,
    password: string,
    username: string,
    role: UserRoles,
    lastLogin: Date | string | null = null
  ): Promise<User> {
    const encryptedPassword = await bcrypt.hash(password, 10);
    return new User(new UUID(), name, email, encryptedPassword, username, role, UserStatus.CREATED, lastLogin);
  }

  // Static factory method to create a user from repository data
  public static fromRepository(
    id: string,
    name: string,
    email: string,
    password: string,
    username: string,
    role: UserRoles,
    status: UserStatus,
    lastLogin: Date | string | null = null
  ): User {
    return new User(new UUID(id), name, email, password, username, role, status, lastLogin);
  }

  public static toPayload(user: User): any {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin
    };
  }

  public async setNewPassword(newPassword: string): Promise<void> {
    try {
      this._password = await bcrypt.hash(newPassword, 10);
    } catch (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }
  
  get id(): string {
    return this._id.toString(); 
  }

  get name(): string | null {
    return this._name;
  }

  get email(): string | null {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get username(): string | null {
    return this._username;
  }

  get lastLogin(): Date | string | null {
    return this._lastLogin;
  }

  get role(): UserRoles {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  /*
  set name(value: string | null) {
    if (value !== this._name) {
      this._name = value;
    }
  }

  set email(value: string | null) {
    if (value !== this._email) {
      this._email = value;
    }
  }

  set password(value: string) {
    if (value !== this._password) {
      this._password = value;
    }
  }

  set username(value: string | null) {
    if (value !== this._username) {
      this._username = value;
    }
  }

  set role(value: UserRoles) {
    if (value !== this._role) {
      this._role = value;
    }
  }

  set lastLogin(value: Date | string | null) {
    if (value !== this._lastLogin) {
      this._lastLogin = value;
    }
  }
  */

  // Status-specific methods
  blockUser(): void {
    this._setStatus(UserStatus.BLOCKED);
  }

  activateUser(): void {
    this._setStatus(UserStatus.ACTIVE);
  }

  deactivateUser(): void {
    this._setStatus(UserStatus.INACTIVE);
  }

  // Private method to update status ensuring idempotency
  private _setStatus(newStatus: UserStatus): void {
    if (newStatus !== this._status) {
      this._status = newStatus;
    }
  }
}
