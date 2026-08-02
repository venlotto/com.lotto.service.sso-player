import {
  isCanonicalVePhone,
  normalizeVePhone,
  phoneLookupCandidates,
} from "./phone";

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
});

describe("phoneLookupCandidates", () => {
  it("puts the canonical form first so it wins over a legacy duplicate", () => {
    const candidates = phoneLookupCandidates("4120000001");
    expect(candidates[0]).toBe("04120000001");
    expect(candidates).toContain("4120000001");
    expect(candidates).toContain("584120000001");
  });

  it("keeps non-phone usernames usable", () => {
    expect(phoneLookupCandidates("admin")).toEqual(["admin"]);
  });

  it("never yields duplicates", () => {
    const candidates = phoneLookupCandidates("04120000001");
    expect(new Set(candidates).size).toBe(candidates.length);
  });

  it("returns nothing useful for empty input", () => {
    expect(phoneLookupCandidates("")).toEqual([]);
  });
});
