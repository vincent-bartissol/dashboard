"use client";

import { FormEvent, useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { authClient } from "@/lib/auth-client";
import { ARRONDISSEMENTS } from "@/lib/opendata/arrondissement";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function ProfileForm({
  firstName,
  lastName,
  email,
  emailVerified,
  arrondissement,
}: {
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  arrondissement: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [emailPending, setEmailPending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  async function onChangeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newEmail = String(form.get("email") ?? "").trim();
    setEmailError(null);
    setEmailSent(false);
    if (newEmail === email) {
      setEmailError("C’est déjà votre adresse.");
      return;
    }
    setEmailPending(true);
    const result = await authClient.changeEmail({
      newEmail,
      callbackURL: "/dashboard/profile",
    });
    setEmailPending(false);
    if (result.error) {
      setEmailError(result.error.message ?? "Une erreur est survenue.");
      return;
    }
    setEmailSent(true);
  }

  return (
    <div className="space-y-8">
      <form
        action={(formData) => {
          const value = String(formData.get("arrondissement") ?? "");
          setError(null);
          setSaved(false);
          startTransition(async () => {
            const result = await updateProfile({
              firstName: String(formData.get("firstName") ?? ""),
              lastName: String(formData.get("lastName") ?? ""),
              arrondissement: value || null,
            });
            if (result.ok) {
              setSaved(true);
              return;
            }
            setError(result.error);
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            autoComplete="given-name"
            defaultValue={firstName}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            name="lastName"
            required
            autoComplete="family-name"
            defaultValue={lastName}
          />
        </div>
        <div>
          <Label htmlFor="arrondissement">Territoire préféré</Label>
          <Select id="arrondissement" name="arrondissement" defaultValue={arrondissement ?? ""}>
            <option value="">Toute Paris</option>
            <option value="montreuil">Montreuil · Robespierre (93100)</option>
            {ARRONDISSEMENTS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label} — {item.zip}
              </option>
            ))}
          </Select>
        </div>
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        {saved ? <p className="text-sm text-muted">Profil enregistré.</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>

      <form onSubmit={onChangeEmail} className="space-y-4 border-t border-line pt-6">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email}
          />
          <p className="mt-1 text-sm text-muted">
            {emailVerified ? "Adresse confirmée." : "En attente de confirmation."}
          </p>
        </div>
        {emailError ? <p className="text-sm text-accent">{emailError}</p> : null}
        {emailSent ? (
          <p className="text-sm text-muted">
            Un e-mail de confirmation a été envoyé à votre adresse actuelle.
          </p>
        ) : null}
        <Button type="submit" variant="ghost" disabled={emailPending}>
          {emailPending ? "Envoi…" : "Changer l’e-mail"}
        </Button>
      </form>
    </div>
  );
}
