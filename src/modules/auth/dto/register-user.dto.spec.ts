import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RegisterUserDto } from "./register-user.dto";

async function errorFields(obj: Partial<RegisterUserDto>): Promise<string[]> {
  const instance = plainToInstance(RegisterUserDto, obj);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

const PLAYER_PIN = "1234";
const SHORT_PIN = "123";

describe("RegisterUserDto validation", () => {
  it("accepts a valid phone + 4-char password", async (): Promise<void> => {
    expect(await errorFields({ phone: "4141234567", password: PLAYER_PIN })).toEqual([]);
  });

  it("accepts a phone with country code and spaces/dashes", async (): Promise<void> => {
    expect(await errorFields({ phone: "+58 414-123 4567", password: PLAYER_PIN })).toEqual([]);
  });

  it("rejects a malformed phone", async (): Promise<void> => {
    expect(await errorFields({ phone: "not-a-phone", password: PLAYER_PIN })).toContain("phone");
  });

  it("rejects a too-short phone", async (): Promise<void> => {
    expect(await errorFields({ phone: "123", password: PLAYER_PIN })).toContain("phone");
  });

  it("rejects a password shorter than 4 characters (loosened policy)", async (): Promise<void> => {
    expect(await errorFields({ phone: "4141234567", password: SHORT_PIN })).toContain("password");
  });

  it("rejects a missing phone", async (): Promise<void> => {
    expect(await errorFields({ phone: undefined, password: PLAYER_PIN })).toContain("phone");
  });

  it("rejects a missing password", async (): Promise<void> => {
    expect(await errorFields({ phone: "4141234567", password: undefined })).toContain("password");
  });
});
