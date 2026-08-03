import {
  getAllowedOrigins,
  getAppName,
  getAppPort,
  getCookieSecret,
  getCorsFallbackOrigin,
  getJwtSecret,
  getThrottleLimit,
  getThrottleTtlSeconds,
} from "./env.config";

const ENV_KEYS = [
  "COOKIE_SECRET",
  "APP_PORT",
  "APP_NAME",
  "THROTTLE_TTL_SECONDS",
  "THROTTLE_LIMIT",
  "JWT_SECRET",
  "ALLOWED_ORIGINS",
  "CORS_FALLBACK_ORIGIN",
] as const;

const JWT_SECRET_VALUE = "unit-test-jwt-signing-key";

describe("env.config", () => {
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const savedValue = savedEnv[key];
      if (savedValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedValue;
      }
    }
  });

  describe("getCookieSecret", () => {
    it("should return undefined when COOKIE_SECRET is not set", () => {
      expect(getCookieSecret()).toBeUndefined();
    });

    it("should return the configured value verbatim", () => {
      process.env["COOKIE_SECRET"] = "cookie-signing-value";

      expect(getCookieSecret()).toBe("cookie-signing-value");
    });
  });

  describe("getAppPort", () => {
    it("should fall back to 3000 when APP_PORT is not set", () => {
      expect(getAppPort()).toBe("3000");
    });

    it("should fall back to 3000 when APP_PORT is empty", () => {
      process.env["APP_PORT"] = "";

      expect(getAppPort()).toBe("3000");
    });

    it("should return the configured port", () => {
      process.env["APP_PORT"] = "8080";

      expect(getAppPort()).toBe("8080");
    });
  });

  describe("getAppName", () => {
    it("should return undefined when APP_NAME is not set", () => {
      expect(getAppName()).toBeUndefined();
    });

    it("should return the configured value", () => {
      process.env["APP_NAME"] = "sso-player";

      expect(getAppName()).toBe("sso-player");
    });
  });

  describe("getThrottleTtlSeconds", () => {
    it("should fall back to 60 when THROTTLE_TTL_SECONDS is not set", () => {
      expect(getThrottleTtlSeconds()).toBe("60");
    });

    it("should fall back to 60 when THROTTLE_TTL_SECONDS is empty", () => {
      process.env["THROTTLE_TTL_SECONDS"] = "";

      expect(getThrottleTtlSeconds()).toBe("60");
    });

    it("should return the configured value", () => {
      process.env["THROTTLE_TTL_SECONDS"] = "120";

      expect(getThrottleTtlSeconds()).toBe("120");
    });
  });

  describe("getThrottleLimit", () => {
    it("should fall back to 10 when THROTTLE_LIMIT is not set", () => {
      expect(getThrottleLimit()).toBe("10");
    });

    it("should fall back to 10 when THROTTLE_LIMIT is empty", () => {
      process.env["THROTTLE_LIMIT"] = "";

      expect(getThrottleLimit()).toBe("10");
    });

    it("should return the configured value", () => {
      process.env["THROTTLE_LIMIT"] = "5";

      expect(getThrottleLimit()).toBe("5");
    });
  });

  describe("getJwtSecret", () => {
    it("should return undefined when JWT_SECRET is not set", () => {
      expect(getJwtSecret()).toBeUndefined();
    });

    it("should return the configured value verbatim", () => {
      process.env["JWT_SECRET"] = JWT_SECRET_VALUE;

      expect(getJwtSecret()).toBe(JWT_SECRET_VALUE);
    });
  });

  describe("getAllowedOrigins", () => {
    it("should return an empty list when ALLOWED_ORIGINS is not set", () => {
      expect(getAllowedOrigins()).toEqual([]);
    });

    it("should split on commas, trim entries and drop empties", () => {
      process.env["ALLOWED_ORIGINS"] =
        " https://app.plus.bingo ,https://admin.plus.bingo, ,";

      expect(getAllowedOrigins()).toEqual([
        "https://app.plus.bingo",
        "https://admin.plus.bingo",
      ]);
    });
  });

  describe("getCorsFallbackOrigin", () => {
    it("should return an empty string when CORS_FALLBACK_ORIGIN is not set", () => {
      expect(getCorsFallbackOrigin()).toBe("");
    });

    it("should return the configured value", () => {
      process.env["CORS_FALLBACK_ORIGIN"] = "https://fallback.plus.bingo";

      expect(getCorsFallbackOrigin()).toBe("https://fallback.plus.bingo");
    });
  });
});
