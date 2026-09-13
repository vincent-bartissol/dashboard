import { describe, expect, it } from "vitest";
import { emailFrom, resolveMailerProvider, smtpOptions } from "./email";

describe("resolveMailerProvider", () => {
  it("defaults to mailpit", () => {
    expect(resolveMailerProvider(undefined)).toBe("mailpit");
    expect(resolveMailerProvider("")).toBe("mailpit");
    expect(resolveMailerProvider("smtp")).toBe("mailpit");
  });

  it("selects resend when requested", () => {
    expect(resolveMailerProvider("resend")).toBe("resend");
  });
});

describe("emailFrom", () => {
  it("uses a local default when unset", () => {
    expect(emailFrom(undefined)).toBe("Paris Ouverte <noreply@localhost>");
    expect(emailFrom("  ")).toBe("Paris Ouverte <noreply@localhost>");
  });

  it("keeps a configured sender", () => {
    expect(emailFrom("Paris Ouverte <noreply@example.com>")).toBe(
      "Paris Ouverte <noreply@example.com>",
    );
  });
});

describe("smtpOptions", () => {
  it("targets Mailpit by default", () => {
    expect(smtpOptions({})).toEqual({
      host: "localhost",
      port: 1025,
      secure: false,
    });
  });

  it("reads host and port from env", () => {
    expect(smtpOptions({ SMTP_HOST: "mail", SMTP_PORT: "2525" })).toEqual({
      host: "mail",
      port: 2525,
      secure: false,
    });
  });
});
