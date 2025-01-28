import * as bcrypt from "bcrypt";

import { UserStatus } from "./enum/user-status.enum";
import { UUID } from "../../../common/value-object/uuid.value-object";

interface TokenPayload {
  sub: string;
  username: string;
  role: string | null;
  [key: string]: unknown;
}

export class User {
  private readonly _id: UUID;
  private _password: string;
  private _username: string | null;
  private _lastLogin: Date | string | null;
  private _roleName: string | null;
  private _status: UserStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: UUID,
    password: string,
    username: string,
    roleName: string | null,
    status: UserStatus,
    lastLogin: Date | string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this._id = id;
    this._password = password;
    this._username = username || null;
    this._roleName = roleName;
    this._status = status;
    this._lastLogin = lastLogin;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  public static async newUser(
    password: string,
    username: string,
    roleName: string | null = null,
    lastLogin: Date | string | null = null,
  ): Promise<User> {
    const encryptedPassword = await bcrypt.hash(password, 10);
    return new User(
      new UUID(),
      encryptedPassword,
      username,
      roleName,
      UserStatus.ACTIVE,
      lastLogin,
    );
  }

  public static fromRepository(
    id: string,
    password: string,
    username: string,
    roleName: string | null,
    status: UserStatus,
    lastLogin: Date | string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): User {
    return new User(
      new UUID(id),
      password,
      username,
      roleName,
      status,
      lastLogin,
      createdAt,
      updatedAt,
    );
  }

  public static toPayload(user: User): TokenPayload {
    return {
      sub: user.id,
      username: user.username || "",
      role: user.roleName,
    };
  }

  public setNewPassword(hashedPassword: string): void {
    this._password = hashedPassword;
  }

  public updateLastLogin(): void {
    this._lastLogin = new Date();
  }

  get id(): string {
    return this._id.toString();
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

  get roleName(): string | null {
    return this._roleName;
  }

  get status(): UserStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  blockUser(): void {
    this._setStatus(UserStatus.BLOCKED);
  }

  activateUser(): void {
    this._setStatus(UserStatus.ACTIVE);
  }

  private _setStatus(newStatus: UserStatus): void {
    if (newStatus !== this._status) {
      this._status = newStatus;
    }
  }
}
