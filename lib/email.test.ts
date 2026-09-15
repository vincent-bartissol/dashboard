import { describe, expect, it } from "vitest";
import {
  assertMailerConfig,
  emailFrom,
  resolveMailerProvider,
  smtpOptions,
} from "./email";
import {
  changeEmailMail,
  escapeHtml,
  otpMail,
  resetPasswordMail,
  verificationMail,
} from "./email/templates";

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

describe("assertMailerConfig", () => {
  it("ignores mailpit", () => {
    expect(() => assertMailerConfig({ MAILER_PROVIDER: "mailpit" })).not.toThrow();
  });

  it("requires key and sender for resend", () => {
    expect(() => assertMailerConfig({ MAILER_PROVIDER: "resend" })).toThrow(/RESEND_API_KEY/);
    expect(() =>
      assertMailerConfig({ MAILER_PROVIDER: "resend", RESEND_API_KEY: "re_test" }),
    ).toThrow(/EMAIL_FROM/);
    expect(() =>
      assertMailerConfig({
        MAILER_PROVIDER: "resend",
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "Paris Ouverte <noreply@example.com>",
      }),
    ).not.toThrow();
  });
});

describe("escapeHtml", () => {
  it("escapes markup", () => {
    expect(escapeHtml(`<a href="x">y&z</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;y&amp;z&lt;/a&gt;",
    );
  });
});

describe("mail templates", () => {
  const url = "https://example.com/confirm?x=<token>";
  const escapedUrl = escapeHtml(url);

  it("builds verification mail with button and text url", () => {
    const mail = verificationMail(url);
    expect(mail.subject).toBe("Confirmez votre adresse e-mail");
    expect(mail.text).toContain(url);
    expect(mail.html).toContain("Confirmer l’adresse");
    expect(mail.html).toContain(escapedUrl);
    expect(mail.html).not.toContain(`href="${url}"`);
  });

  it("builds otp mail without putting the code in the subject", () => {
    const mail = otpMail("123456");
    expect(mail.subject).toBe("Votre code de connexion");
    expect(mail.subject).not.toContain("123456");
    expect(mail.text).toContain("123456");
    expect(mail.html).toContain("123456");
    expect(mail.html).toContain("3 minutes");
  });

  it("builds change-email mail with escaped address", () => {
    const mail = changeEmailMail(url, `a<b>@example.com`);
    expect(mail.subject).toBe("Confirmez le changement d’e-mail");
    expect(mail.text).toContain("a<b>@example.com");
    expect(mail.html).toContain("a&lt;b&gt;@example.com");
    expect(mail.html).toContain("Confirmer le changement");
  });

  it("builds reset-password mail", () => {
    const mail = resetPasswordMail(url);
    expect(mail.subject).toBe("Réinitialisez votre mot de passe");
    expect(mail.text).toContain(url);
    expect(mail.html).toContain("Choisir un mot de passe");
    expect(mail.html).toContain(escapedUrl);
  });
});
