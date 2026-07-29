import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { RegisterUserDto } from "./register-user.dto";

async function errorFields(obj: Partial<RegisterUserDto>): Promise<string[]> {
  const instance = plainToInstance(RegisterUserDto, obj);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

describe("RegisterUserDto validation", () => {
  it("accepts a valid phone + 4-char password", async (): Promise<void> => {
    expect(await errorFields({ phone: "4141234567", password: "1234" })).toEqual([]);
  });

  it("accepts a phone with country code and spaces/dashes", async (): Promise<void> => {
    expect(await errorFields({ phone: "+58 414-123 4567", password: "1234" })).toEqual([]);
  });

  it("rejects a malformed phone", async (): Promise<void> => {
    expect(await errorFields({ phone: "not-a-phone", password: "1234" })).toContain("phone");
  });

  it("rejects a too-short phone", async (): Promise<void> => {
    expect(await errorFields({ phone: "123", password: "1234" })).toContain("phone");
  });

  it("rejects a password shorter than 4 characters (loosened policy)", async (): Promise<void> => {
    expect(await errorFields({ phone: "4141234567", password: "123" })).toContain("password");
  });

  it("rejects a missing phone", async (): Promise<void> => {
    expect(await errorFields({ phone: undefined, password: "1234" })).toContain("phone");
  });

  it("rejects a missing password", async (): Promise<void> => {
    expect(await errorFields({ phone: "4141234567", password: undefined })).toContain("password");
  });
});
