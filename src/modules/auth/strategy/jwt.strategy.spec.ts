import { type ConfigService } from "@nestjs/config";
import { ExtractJwt as PassportExtractJwt } from "passport-jwt";
import { JwtStrategy } from "./jwt.strategy";

type CookieExtractor = (
  request: { cookies?: Record<string, string>; signedCookies?: Record<string, string> } | null | undefined,
) => string | null;

const ExtractJwt = PassportExtractJwt as unknown as {
  fromExtractors: (extractors: CookieExtractor[]) => CookieExtractor;
};

describe("JwtStrategy", () => {
  const JWT_SECRET_VALUE = "unit-test-jwt-signing-key";
  const COOKIE_NAME = "plus_access";

  let capturedExtractors: CookieExtractor[];
  let fromExtractorsSpy: jest.SpyInstance;

  beforeEach(() => {
    capturedExtractors = [];
    fromExtractorsSpy = jest
      .spyOn(ExtractJwt, "fromExtractors")
      .mockImplementation((extractors) => {
        capturedExtractors = extractors;
        return () => null;
      });
  });

  afterEach(() => {
    fromExtractorsSpy.mockRestore();
  });

  const buildConfigService = (
    values: Record<string, string | undefined>,
  ): ConfigService =>
    ({
      get: (key: string) => values[key],
    }) as unknown as ConfigService;

  const buildStrategy = (
    values: Record<string, string | undefined>,
  ): JwtStrategy => new JwtStrategy(buildConfigService(values));

  it("should throw when JWT_SECRET is missing", () => {
    expect(() => buildStrategy({})).toThrow(
      "JWT_SECRET is not defined in configuration",
    );
  });

  it("should only register the bearer extractor when no cookie name is configured", () => {
    buildStrategy({ JWT_SECRET: JWT_SECRET_VALUE });

    expect(capturedExtractors).toHaveLength(1);
  });

  it("should register a cookie extractor first when a cookie name is configured", () => {
    buildStrategy({
      JWT_SECRET: JWT_SECRET_VALUE,
      ACCESS_TOKEN_COOKIE_NAME: COOKIE_NAME,
    });

    expect(capturedExtractors).toHaveLength(2);
  });

  it("should extract the token from the cookies", () => {
    buildStrategy({
      JWT_SECRET: JWT_SECRET_VALUE,
      ACCESS_TOKEN_COOKIE_NAME: COOKIE_NAME,
    });
    const cookieExtractor = capturedExtractors[0];

    expect(cookieExtractor({ cookies: { [COOKIE_NAME]: "token-plain" } })).toBe(
      "token-plain",
    );
  });

  it("should fall back to the signed cookies", () => {
    buildStrategy({
      JWT_SECRET: JWT_SECRET_VALUE,
      ACCESS_TOKEN_COOKIE_NAME: COOKIE_NAME,
    });
    const cookieExtractor = capturedExtractors[0];

    expect(
      cookieExtractor({ signedCookies: { [COOKIE_NAME]: "token-signed" } }),
    ).toBe("token-signed");
  });

  it("should return null when the request is missing or carries no cookie", () => {
    buildStrategy({
      JWT_SECRET: JWT_SECRET_VALUE,
      ACCESS_TOKEN_COOKIE_NAME: COOKIE_NAME,
    });
    const cookieExtractor = capturedExtractors[0];

    expect(cookieExtractor(null)).toBeNull();
    expect(cookieExtractor(undefined)).toBeNull();
    expect(cookieExtractor({})).toBeNull();
  });

  it("should map the jwt payload onto the auth user, defaulting permissions", () => {
    const strategy = buildStrategy({ JWT_SECRET: JWT_SECRET_VALUE });

    const withPermissions = strategy.validate({
      sub: "user-1",
      username: "player-one",
      role: "PLAYER",
      permissions: ["perm-a"],
    });
    expect(withPermissions).toEqual({
      sub: "user-1",
      username: "player-one",
      role: "PLAYER",
      permissions: ["perm-a"],
    });

    const withoutPermissions = strategy.validate({
      sub: "user-2",
      username: null,
    });
    expect(withoutPermissions).toEqual({
      sub: "user-2",
      username: null,
      role: undefined,
      permissions: [],
    });
  });
});
