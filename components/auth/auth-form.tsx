"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { stripLocalePrefix } from "@/i18n/path";
import { DemoEmailPreview } from "@/components/demo/demo-email-preview";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DEMO_OTP_CODE } from "@/lib/demo/seed";
import {
  markEmailVerified,
  requestOtpDemo,
  signInAs,
  signUpDemo,
} from "@/lib/demo/store";
import { otpMail, verificationMail } from "@/lib/email/templates";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { PROFILE_NAME_MAX } from "@/lib/profile-name";
import { safeNext } from "@/lib/safe-next";
import { formString } from "@/lib/safe-string";
import type { AppLocale } from "@/i18n/routing";

type Mode = "login" | "signup";

export function AuthForm({
  mode,
  next,
}: Readonly<{ mode: Mode; next?: string | string[] }>) {
  const t = useTranslations("Auth");
  const td = useTranslations("Demo");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const nextPrefixed = safeNext(next, locale);
  const nextHref = stripLocalePrefix(nextPrefixed);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailPreview, setEmailPreview] = useState<"verification" | "otp" | null>(null);
  const [previewEmail, setPreviewEmail] = useState<string | null>(null);

  function finish() {
    router.push(nextHref);
    router.refresh();
  }

  function enterAs(role: "user" | "admin") {
    setPending(true);
    setError(null);
    signInAs(role);
    setPending(false);
    finish();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = formString(form, "email");
    const password = formString(form, "password");
    const firstName = formString(form, "firstName").trim();
    const lastName = formString(form, "lastName").trim();
    const name = `${firstName} ${lastName}`.trim();

    if (password.length > MAX_PASSWORD_LENGTH) {
      setPending(false);
      setError(t("passwordTooLong"));
      return;
    }
    if (mode === "signup" && (firstName.length > PROFILE_NAME_MAX || lastName.length > PROFILE_NAME_MAX)) {
      setPending(false);
      setError(t("namesTooLong"));
      return;
    }

    if (mode === "signup") {
      signUpDemo({ email, name, firstName, lastName });
      setPreviewEmail(email);
      setEmailPreview("verification");
      setPending(false);
      return;
    }

    signInAs("user", email, email.split("@")[0] ?? "Demo");
    requestOtpDemo(email);
    setPreviewEmail(email);
    setEmailPreview("otp");
    setPending(false);
  }

  function onOpenVerification() {
    markEmailVerified();
    setEmailPreview(null);
    finish();
  }

  function onOpenOtp() {
    setEmailPreview(null);
    finish();
  }

  async function onVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = formString(form, "code").trim();
    if (code !== DEMO_OTP_CODE) {
      setError(t("invalidCode"));
      return;
    }
    finish();
  }

  if (emailPreview === "verification" && previewEmail) {
    const mail = verificationMail(
      `https://vvbb.fr/dashboard/${locale}/dashboard/`,
      locale,
    );
    return (
      <DemoEmailPreview
        mail={{
          ...mail,
          text: `${mail.text}\n\n(${previewEmail})`,
        }}
        onOpen={onOpenVerification}
      />
    );
  }

  if (emailPreview === "otp" && previewEmail) {
    const mail = otpMail(DEMO_OTP_CODE, locale);
    return (
      <div className="space-y-4">
        <DemoEmailPreview mail={mail} onOpen={onOpenOtp} />
        <p className="text-sm text-muted">{td("otpHint")}</p>
        <form onSubmit={onVerifyOtp} className="space-y-4">
          <div>
            <Label htmlFor="code">{t("code")}</Label>
            <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required />
          </div>
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full">
            {t("validate")}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button type="button" className="w-full" disabled={pending} onClick={() => enterAs("user")}>
          {td("enterVisitor")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={pending}
          onClick={() => enterAs("admin")}
        >
          {td("enterAdmin")}
        </Button>
        <p className="text-xs text-muted">{td("anyPassword")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 border-t border-line pt-4">
        {mode === "signup" ? (
          <>
            <div>
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                autoComplete="given-name"
                maxLength={PROFILE_NAME_MAX}
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                autoComplete="family-name"
                maxLength={PROFILE_NAME_MAX}
              />
            </div>
          </>
        ) : null}
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("pending") : mode === "signup" ? t("submitSignup") : t("submitLogin")}
        </Button>
      </form>
    </div>
  );
}
