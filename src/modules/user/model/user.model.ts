import * as bcrypt from "bcrypt";

import { UserStatus } from "./enum/user-status.enum";
import { UUID } from "../../../common/value-object/uuid.value-object";

interface TokenPayload {
  sub: string;
  username: string;
  roles: string[];
  permissions: string[];
  [key: string]: unknown;
}

export class User {
  private readonly _id: UUID;
  private _password: string;
  private _username: string | null;
  private _lastLogin: Date | string | null;
  private _roleNames: string[];
  private _status: UserStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _permissions: string[];

  private constructor(
    id: UUID,
    password: string,
    username: string,
    roleNames: string[],
    status: UserStatus,
    lastLogin: Date | string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    permissions: string[] = []
  ) {
    this._id = id;
    this._password = password;
    this._username = username || null;
    this._roleNames = roleNames;
    this._status = status;
    this._lastLogin = lastLogin;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._permissions = permissions;
  }

  public static async newUser(
    password: string,
    username: string,
    roleNames: string[] = [],
    lastLogin: Date | string | null = null,
    permissions: string[] = []
  ): Promise<User> {
    const encryptedPassword = await bcrypt.hash(password, 10);
    return new User(
      new UUID(),
      encryptedPassword,
      username,
      roleNames,
      UserStatus.ACTIVE,
      lastLogin,
      new Date(),
      new Date(),
      permissions
    );
  }

  public static fromRepository(
    id: string,
    password: string,
    username: string,
    roleNames: string[],
    status: UserStatus,
    lastLogin: Date | string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    permissions: string[] = []
  ): User {
    return new User(
      new UUID(id),
      password,
      username,
      roleNames,
      status,
      lastLogin,
      createdAt,
      updatedAt,
      permissions
    );
  }

  public static toPayload(user: User): TokenPayload {
    return {
      sub: user.id,
      username: user.username || "",
      roles: user.roleNames,
      permissions: user.permissions,
    };
  }

  public setNewPassword(hashedPassword: string): void {
    this._password = hashedPassword;
  }

  public updateLastLogin(): void {
    this._lastLogin = new Date();
  }

  public addRole(roleName: string, permissions: string[]): void {
    if (!this._roleNames.includes(roleName)) {
      this._roleNames.push(roleName);
      this._permissions = [...new Set([...this._permissions, ...permissions])];
      this._updatedAt = new Date();
    }
  }

  public removeRole(roleName: string, rolePermissions: string[]): void {
    const index = this._roleNames.indexOf(roleName);
    if (index !== -1) {
      this._roleNames.splice(index, 1);
      this._permissions = this._permissions.filter(p => !rolePermissions.includes(p));
      this._updatedAt = new Date();
    }
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

  get roleNames(): string[] {
    return [...this._roleNames];
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

  get permissions(): string[] {
    return this._permissions;
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
      this._updatedAt = new Date();
    }
  }
}
