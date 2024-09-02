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
  private _identification: string | null; // now optional
  private _phone: string | null; // now optional

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
    identification: string | null = null,
    phone: string | null = null,
    lastLogin: Date | string | null = null
  ) {
    this._id = id;
    this._name = name || null;
    this._email = email || null;
    this._password = password;
    this._username = username || null;
    this._role = role;
    this._status = status;
    this._identification = identification || null;
    this._phone = phone || null;
    this._lastLogin = lastLogin;
  }

  public static async newUser(
    name: string,
    email: string,
    password: string,
    username: string,
    role: UserRoles,
    identification: string | null = null,
    phone: string | null = null,
    lastLogin: Date | string | null = null
  ): Promise<User> {
    const encryptedPassword = await bcrypt.hash(password, 10);
    return new User(new UUID(), name, email, encryptedPassword, username, role, UserStatus.CREATED, identification, phone, lastLogin);
  }

  public static fromRepository(
    id: string,
    name: string,
    email: string,
    password: string,
    username: string,
    role: UserRoles,
    status: UserStatus,
    identification: string | null = null,
    phone: string | null = null,
    lastLogin: Date | string | null = null
  ): User {
    return new User(new UUID(id), name, email, password, username, role, status, identification, phone, lastLogin);
  }

  public static toPayload(user: User): any {
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      identification: user.identification,
      phone: user.phone,
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

  get identification(): string | null {
    return this._identification;
  }

  get phone(): string | null {
    return this._phone;
  }

  blockUser(): void {
    this._setStatus(UserStatus.BLOCKED);
  }

  activateUser(): void {
    this._setStatus(UserStatus.ACTIVE);
  }

  deactivateUser(): void {
    this._setStatus(UserStatus.INACTIVE);
  }

  private _setStatus(newStatus: UserStatus): void {
    if (newStatus !== this._status) {
      this._status = newStatus;
    }
  }
}
