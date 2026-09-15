"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function otpErrorMessage(error: { message?: string; code?: string; status?: number }) {
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  if (text.includes("invalid")) {
    return "Code invalide.";
  }
  return error.message ?? "Une erreur est survenue.";
}

function otpSendErrorMessage(error: { message?: string; status?: number }) {
  if (error.status === 500 || !error.message) {
    return "Impossible d’envoyer le code.";
  }
  return error.message;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailForResend, setEmailForResend] = useState<string | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [resent, setResent] = useState(false);

  async function resendVerification() {
    if (!emailForResend) return;
    setPending(true);
    setError(null);
    setResent(false);
    const result = await authClient.sendVerificationEmail({
      email: emailForResend,
      callbackURL: next,
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Une erreur est survenue.");
      return;
    }
    setResent(true);
  }

  async function sendLoginOtp() {
    const result = await authClient.twoFactor.sendOtp({});
    if (result.error) {
      setError(otpSendErrorMessage(result.error));
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
      setError(otpErrorMessage(result.error));
      return;
    }
    router.push(next);
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
        ? await authClient.signUp.email({ email, password, name, callbackURL: next })
        : await authClient.signIn.email({ email, password, callbackURL: next });

    if (result.error) {
      setPending(false);
      if (mode === "login" && isUnverifiedError(result.error)) {
        setEmailForResend(email);
        setAwaitingVerification(true);
        setError("Vérifiez votre e-mail avant de vous connecter.");
        return;
      }
      setError(result.error.message ?? "Une erreur est survenue.");
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
    router.push(next);
    router.refresh();
  }

  if (mode === "signup" && awaitingVerification) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Un e-mail de confirmation a été envoyé
          {emailForResend ? ` à ${emailForResend}` : ""}. Cliquez sur le lien pour
          activer votre compte.
        </p>
        {resent ? <p className="text-sm text-muted">Un nouvel e-mail a été envoyé.</p> : null}
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        <Button type="button" className="w-full" disabled={pending} onClick={resendVerification}>
          {pending ? "Veuillez patienter…" : "Renvoyer l’e-mail"}
        </Button>
      </div>
    );
  }

  if (mode === "login" && awaitingOtp) {
    return (
      <form key="otp-step" onSubmit={onVerifyOtp} className="space-y-4">
        <p className="text-sm text-muted">
          Un code a été envoyé
          {emailForResend ? ` à ${emailForResend}` : " à votre e-mail"}. Il expire
          dans 3 minutes.
        </p>
        <div>
          <Label htmlFor="code">Code</Label>
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
        {resent ? <p className="text-sm text-muted">Un nouveau code a été envoyé.</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Veuillez patienter…" : "Valider"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={pending}
          onClick={resendOtp}
        >
          {pending ? "Veuillez patienter…" : "Renvoyer le code"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" ? (
        <>
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" required autoComplete="given-name" />
          </div>
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" name="lastName" required autoComplete="family-name" />
          </div>
        </>
      ) : null}
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
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
      {resent ? <p className="text-sm text-muted">Un nouvel e-mail a été envoyé.</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Veuillez patienter…"
          : mode === "signup"
            ? "Créer le compte"
            : "Se connecter"}
      </Button>
      {mode === "login" && awaitingVerification ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={pending}
          onClick={resendVerification}
        >
          {pending ? "Veuillez patienter…" : "Renvoyer l’e-mail de confirmation"}
        </Button>
      ) : null}
    </form>
  );
}
