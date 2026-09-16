"use client";

import { FormEvent, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { withLocale } from "@/i18n/path";
import { updateProfile } from "@/lib/actions/profile";
import { authClient } from "@/lib/auth-client";
import { ARRONDISSEMENTS } from "@/lib/opendata/arrondissement";
import { PROFILE_NAME_MAX } from "@/lib/profile-name";
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
  const t = useTranslations("Profile");
  const locale = useLocale();
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
      setEmailError(t("emailSame"));
      return;
    }
    setEmailPending(true);
    const result = await authClient.changeEmail({
      newEmail,
      callbackURL: withLocale("/dashboard/profile", locale),
    });
    setEmailPending(false);
    if (result.error) {
      setEmailError(t("genericError"));
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
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            autoComplete="given-name"
            maxLength={PROFILE_NAME_MAX}
            defaultValue={firstName}
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
            defaultValue={lastName}
          />
        </div>
        <div>
          <Label htmlFor="arrondissement">{t("district")}</Label>
          <Select id="arrondissement" name="arrondissement" defaultValue={arrondissement ?? ""}>
            <option value="">{t("allParis")}</option>
            <option value="montreuil">{t("montreuil")}</option>
            {ARRONDISSEMENTS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label} — {item.zip}
              </option>
            ))}
          </Select>
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        {saved ? <p aria-live="polite" className="text-sm text-muted">{t("saved")}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
      </form>

      <form onSubmit={onChangeEmail} className="space-y-4 border-t border-line pt-6">
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email}
          />
          <p className="mt-1 text-sm text-muted">
            {emailVerified ? t("emailVerified") : t("emailPending")}
          </p>
        </div>
        {emailError ? <p role="alert" className="text-sm text-danger">{emailError}</p> : null}
        {emailSent ? (
          <p aria-live="polite" className="text-sm text-muted">
            {t("emailSent")}
          </p>
        ) : null}
        <Button type="submit" variant="ghost" disabled={emailPending}>
          {emailPending ? t("sending") : t("changeEmail")}
        </Button>
      </form>
    </div>
  );
}
