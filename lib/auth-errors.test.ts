import { describe, expect, it } from "vitest";
import {
  isExistingUserSignupError,
  isUnverifiedAuthError,
  mapAuthError,
} from "./auth-errors";

describe("mapAuthError", () => {
  it("maps unknown messages to generic", () => {
    expect(mapAuthError({ code: "SOMETHING_INTERNAL", status: 500 })).toBe("generic");
    expect(mapAuthError(undefined)).toBe("generic");
    expect(mapAuthError({})).toBe("generic");
  });

  it("maps signup already-exists codes", () => {
    expect(mapAuthError({ code: "USER_ALREADY_EXISTS" })).toBe("existingUser");
    expect(mapAuthError({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" })).toBe("existingUser");
    expect(isExistingUserSignupError({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" })).toBe(
      true,
    );
  });

  it("maps unverified login", () => {
    expect(mapAuthError({ code: "EMAIL_NOT_VERIFIED" })).toBe("unverified");
    expect(isUnverifiedAuthError({ status: 403 })).toBe(true);
    expect(isUnverifiedAuthError({ code: "EMAIL_NOT_VERIFIED" })).toBe(true);
  });

  it("maps credential and otp codes", () => {
    expect(mapAuthError({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe("invalidCredentials");
    expect(mapAuthError({ code: "INVALID_OTP" })).toBe("invalidCode");
    expect(mapAuthError({ code: "INVALID_TOKEN" })).toBe("invalidToken");
    expect(mapAuthError({ code: "INVALID_PASSWORD" })).toBe("wrongPassword");
  });
});
