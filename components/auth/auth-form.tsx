"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");

    const result =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name, callbackURL: next })
        : await authClient.signIn.email({ email, password, callbackURL: next });

    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Une erreur est survenue.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" ? (
        <div>
          <Label htmlFor="name">Nom</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
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
      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Veuillez patienter…"
          : mode === "signup"
            ? "Créer le compte"
            : "Se connecter"}
      </Button>
    </form>
  );
}
