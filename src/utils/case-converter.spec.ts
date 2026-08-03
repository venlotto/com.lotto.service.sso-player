import { camelToSnakeCase, snakeToCamelCase } from "./case-converter";

describe("case-converter", () => {
  describe("camelToSnakeCase", () => {
    it("should prefix every uppercase letter with an underscore and lowercase it", () => {
      expect(camelToSnakeCase("currentPassword")).toBe("current_password");
    });

    it("should leave a string without uppercase letters unchanged", () => {
      expect(camelToSnakeCase("username")).toBe("username");
    });
  });

  describe("snakeToCamelCase", () => {
    it("should uppercase the letter after each underscore and drop the underscore", () => {
      expect(snakeToCamelCase("current_password")).toBe("currentPassword");
    });

    it("should convert multi-segment snake case", () => {
      expect(snakeToCamelCase("last_login_at")).toBe("lastLoginAt");
    });

    it("should leave a string without underscores unchanged", () => {
      expect(snakeToCamelCase("username")).toBe("username");
    });
  });

  it("should round-trip camelCase through snake_case and back", () => {
    expect(snakeToCamelCase(camelToSnakeCase("newPassword"))).toBe(
      "newPassword",
    );
  });
});
