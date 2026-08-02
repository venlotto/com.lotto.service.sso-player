import { isCanonicalVePhone, normalizeVePhone, phoneLookupKey } from "./phone";

describe("normalizeVePhone", () => {
  it("canonicalizes every accepted spelling to the 0-prefixed form", () => {
    const inputs = [
      "04120000001",
      "4120000001",
      "584120000001",
      "+584120000001",
      "00584120000001",
      "0412-000-0001",
      "0412 000 0001",
      "(0412) 000-0001",
    ];
    for (const input of inputs) {
      expect(normalizeVePhone(input)).toBe("04120000001");
    }
  });

  it("accepts every Venezuelan mobile prefix", () => {
    for (const prefix of ["412", "414", "416", "424", "426"]) {
      expect(normalizeVePhone(`${prefix}1234567`)).toBe(`0${prefix}1234567`);
    }
  });

  it("rejects values that cannot be a Venezuelan mobile", () => {
    // Real shapes observed in production data that must NOT be guessed at.
    const rejected = [
      "admin",
      "jugador_dev1",
      "414293393", // 9 digits — dirty row
      "02121234567", // landline prefix
      "",
      null,
      undefined,
      "123",
    ];
    for (const input of rejected) {
      expect(normalizeVePhone(input)).toBeNull();
    }
  });
});

describe("isCanonicalVePhone", () => {
  it("recognizes the canonical form only", () => {
    expect(isCanonicalVePhone("04120000001")).toBe(true);
    expect(isCanonicalVePhone("4120000001")).toBe(false);
    expect(isCanonicalVePhone("+584120000001")).toBe(false);
    expect(isCanonicalVePhone("admin")).toBe(false);
  });

  it("rejects null, undefined and empty input", () => {
    expect(isCanonicalVePhone(null)).toBe(false);
    expect(isCanonicalVePhone(undefined)).toBe(false);
    expect(isCanonicalVePhone("")).toBe(false);
  });
});

describe("phoneLookupKey", () => {
  it("resolves any accepted spelling to the one canonical key", () => {
    for (const input of ["4120000001", "04120000001", "+584120000001"]) {
      expect(phoneLookupKey(input)).toBe("04120000001");
    }
  });

  // There is deliberately no legacy fallback: accepting several spellings for
  // one person is the ambiguity this whole change exists to remove.
  it("refuses to treat a non-phone as a lookup key", () => {
    expect(phoneLookupKey("admin")).toBeNull();
    expect(phoneLookupKey("414293393")).toBeNull();
    expect(phoneLookupKey("")).toBeNull();
  });
});
