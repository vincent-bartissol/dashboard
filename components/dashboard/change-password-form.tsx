"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const MIN_PASSWORD_LENGTH = 8;

function passwordErrorMessage(error: { message?: string; code?: string }) {
  switch (error.code) {
    case "INVALID_PASSWORD":
      return "Mot de passe actuel incorrect.";
    case "PASSWORD_TOO_SHORT":
      return "Le mot de passe doit contenir au moins 8 caractères.";
    case "PASSWORD_TOO_LONG":
      return "Le mot de passe est trop long.";
    default:
      return error.message ?? "Une erreur est survenue.";
  }
}

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    setError(null);
    setSaved(false);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Le nouveau mot de passe doit être différent.");
      return;
    }

    setPending(true);
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);

    if (result.error) {
      setError(passwordErrorMessage(result.error));
      return;
    }

    form.reset();
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-heading">Mot de passe</h2>
      <p className="text-sm text-muted">Les autres sessions seront déconnectées.</p>
      <div>
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <div>
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
        />
      </div>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {saved ? <p className="text-sm text-muted">Mot de passe mis à jour.</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
