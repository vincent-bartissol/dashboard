"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { ARRONDISSEMENTS } from "@/lib/opendata/arrondissement";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function ProfileForm({
  firstName,
  lastName,
  email,
  arrondissement,
}: {
  firstName: string;
  lastName: string;
  email: string;
  arrondissement: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(formData) => {
        const value = String(formData.get("arrondissement") ?? "");
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await updateProfile({
            firstName: String(formData.get("firstName") ?? ""),
            lastName: String(formData.get("lastName") ?? ""),
            email: String(formData.get("email") ?? ""),
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
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={email}
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
  );
}
