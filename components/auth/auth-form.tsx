"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { stripLocalePrefix } from "@/i18n/path";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Mode = "login" | "signup";

function isUnverifiedError(error: { status?: number; code?: string }) {
  return error.status === 403 || error.code === "EMAIL_NOT_VERIFIED";
}

function needsTwoFactor(data: unknown): boolean {
  return Boolean(
    data &&
      typeof data === "object" &&
      "twoFactorRedirect" in data &&
      (data as { twoFactorRedirect?: boolean }).twoFactorRedirect,
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPrefixed = safeNext(searchParams.get("next"), locale);
  const nextHref = stripLocalePrefix(nextPrefixed);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailForResend, setEmailForResend] = useState<string | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [resent, setResent] = useState(false);

  function genericError(message?: string) {
    return message ?? t("genericError");
  }

  async function resendVerification() {
    if (!emailForResend) return;
    setPending(true);
    setError(null);
    setResent(false);
    const result = await authClient.sendVerificationEmail({
      email: emailForResend,
      callbackURL: nextPrefixed,
    });
    setPending(false);
    if (result.error) {
      setError(genericError(result.error.message));
      return;
    }
    setResent(true);
  }

  async function sendLoginOtp() {
    const result = await authClient.twoFactor.sendOtp({});
    if (result.error) {
      setError(
        result.error.status === 500 || !result.error.message
          ? t("otpSendFailed")
          : result.error.message,
      );
      return false;
    }
    return true;
  }

  async function resendOtp() {
    setPending(true);
    setError(null);
    setResent(false);
    const ok = await sendLoginOtp();
    setPending(false);
    if (ok) {
      setResent(true);
    }
  }

  async function onVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResent(false);
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "").trim();
    const result = await authClient.twoFactor.verifyOtp({ code });
    setPending(false);
    if (result.error) {
      const text = `${result.error.code ?? ""} ${result.error.message ?? ""}`.toLowerCase();
      setError(text.includes("invalid") ? t("invalidCode") : genericError(result.error.message));
      return;
    }
    router.push(nextHref);
    router.refresh();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResent(false);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const name = `${firstName} ${lastName}`.trim();

    const result =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name, callbackURL: nextPrefixed })
        : await authClient.signIn.email({ email, password, callbackURL: nextPrefixed });

    if (result.error) {
      setPending(false);
      if (mode === "login" && isUnverifiedError(result.error)) {
        setEmailForResend(email);
        setAwaitingVerification(true);
        setError(t("verifyBeforeLogin"));
        return;
      }
      setError(genericError(result.error.message));
      return;
    }

    if (mode === "signup") {
      setPending(false);
      setEmailForResend(email);
      setAwaitingVerification(true);
      return;
    }

    if (needsTwoFactor(result.data)) {
      setEmailForResend(email);
      setAwaitingOtp(true);
      const ok = await sendLoginOtp();
      setPending(false);
      if (ok) {
        setResent(false);
      }
      return;
    }

    setPending(false);
    router.push(nextHref);
    router.refresh();
  }

  if (mode === "signup" && awaitingVerification) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          {emailForResend ? t("signupSentTo", { email: emailForResend }) : t("signupSent")}
        </p>
        {resent ? <p className="text-sm text-muted">{t("emailResent")}</p> : null}
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        <Button type="button" className="w-full" disabled={pending} onClick={resendVerification}>
          {pending ? t("pending") : t("resendEmail")}
        </Button>
      </div>
    );
  }

  if (mode === "login" && awaitingOtp) {
    return (
      <form key="otp-step" onSubmit={onVerifyOtp} className="space-y-4">
        <p className="text-sm text-muted">
          {emailForResend ? t("otpSentTo", { email: emailForResend }) : t("otpSent")}
        </p>
        <div>
          <Label htmlFor="code">{t("code")}</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            minLength={6}
            maxLength={6}
            pattern="[0-9]{6}"
          />
        </div>
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        {resent ? <p className="text-sm text-muted">{t("otpResent")}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("pending") : t("validate")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={pending}
          onClick={resendOtp}
        >
          {pending ? t("pending") : t("resendCode")}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" ? (
        <>
          <div>
            <Label htmlFor="firstName">{t("firstName")}</Label>
            <Input id="firstName" name="firstName" required autoComplete="given-name" />
          </div>
          <div>
            <Label htmlFor="lastName">{t("lastName")}</Label>
            <Input id="lastName" name="lastName" required autoComplete="family-name" />
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
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </div>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {resent ? <p className="text-sm text-muted">{t("emailResent")}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("pending") : mode === "signup" ? t("submitSignup") : t("submitLogin")}
      </Button>
      {mode === "login" && awaitingVerification ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={pending}
          onClick={resendVerification}
        >
          {pending ? t("pending") : t("resendConfirm")}
        </Button>
      ) : null}
    </form>
  );
}
