import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { User } from "../../user/model/user.model";
import { AuthService } from "../services/auth.service";

/** Field names passport-local reads the credentials from on the request body. */
const USERNAME_FIELD_NAME = "username";
const CREDENTIAL_FIELD_NAME = "password";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: USERNAME_FIELD_NAME,
      passwordField: CREDENTIAL_FIELD_NAME,
    });
  }

  async validate(username: string, password: string): Promise<User> {
    const user = (await this.authService.validateUser(
      username,
      password,
    )) as User | null;
    if (user === null) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return user;
  }
}
