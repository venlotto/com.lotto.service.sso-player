import { JwtService } from "@nestjs/jwt";
import { Test, type TestingModule } from "@nestjs/testing";
import { AuthModule } from "./auth.module";

// jwt.strategy.ts validates issuer and audience from JWT_ISSUER/JWT_AUDIENCE,
// and every downstream service (streaker club, blackjack, bingo crush) does the
// same. A token signed without those claims is rejected by its own issuer, so
// these assertions pin the signing side to the validating side.
describe("access token issuer and audience claims", () => {
  const issuer = "https://dev1.koperca.com/service.sso-player";
  const audience = "dev1.koperca.com";
  let moduleRef: TestingModule;
  let jwtService: JwtService;

  beforeAll(async (): Promise<void> => {
    process.env["JWT_SECRET"] = "jwt-claims-test-secret";
    process.env["JWT_ISSUER"] = issuer;
    process.env["JWT_AUDIENCE"] = audience;
    process.env["DATABASE_URL"] =
      process.env["DATABASE_URL"] ??
      "postgresql://postgres:postgres@localhost:5432/app";

    moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ isTestEnvironment: true })],
    }).compile();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async (): Promise<void> => {
    await moduleRef.close();
  });

  it("signs access tokens with the configured issuer and audience", (): void => {
    const actual = jwtService.decode<{ iss?: string; aud?: string }>(
      jwtService.sign({ sub: "player-uuid" }),
    );

    expect(actual.iss).toBe(issuer);
    expect(actual.aud).toBe(audience);
  });

  it("issues tokens its own verifier accepts", (): void => {
    const token = jwtService.sign({ sub: "player-uuid" });

    expect((): unknown => jwtService.verify(token, { issuer, audience })).not.toThrow();
  });
});
