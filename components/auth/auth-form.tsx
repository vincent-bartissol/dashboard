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

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailForResend, setEmailForResend] = useState<string | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
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

    setPending(false);
    if (result.error) {
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
      setEmailForResend(email);
      setAwaitingVerification(true);
      return;
    }

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
