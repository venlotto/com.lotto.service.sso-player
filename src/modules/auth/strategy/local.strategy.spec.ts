import { UnauthorizedException } from "@nestjs/common";
import { type User } from "../../user/model/user.model";
import { type AuthService } from "../services/auth.service";
import { LocalStrategy } from "./local.strategy";

describe("LocalStrategy", () => {
  const PLAYER_PIN = "Pl4yer!Pin";

  let validateUserMock: jest.Mock;
  let strategy: LocalStrategy;

  beforeEach(() => {
    validateUserMock = jest.fn();
    const authService = {
      validateUser: validateUserMock,
    } as unknown as AuthService;
    strategy = new LocalStrategy(authService);
  });

  it("should return the user when the credentials validate", async () => {
    const user = { id: "user-1", username: "player-one" } as unknown as User;
    validateUserMock.mockResolvedValue(user);

    const actualUser = await strategy.validate("player-one", PLAYER_PIN);

    expect(validateUserMock).toHaveBeenCalledWith("player-one", PLAYER_PIN);
    expect(actualUser).toBe(user);
  });

  it("should throw UnauthorizedException when the credentials do not validate", async () => {
    validateUserMock.mockResolvedValue(null);

    await expect(strategy.validate("player-one", PLAYER_PIN)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
