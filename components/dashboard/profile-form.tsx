"use client";

import { useTransition } from "react";
import { saveArrondissement } from "@/lib/actions/profile";
import { ARRONDISSEMENTS } from "@/lib/opendata/arrondissement";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";

export function ProfileForm({ arrondissement }: { arrondissement: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        const value = String(formData.get("arrondissement") ?? "");
        startTransition(() => {
          void saveArrondissement(value || null);
        });
      }}
      className="space-y-4"
    >
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
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
