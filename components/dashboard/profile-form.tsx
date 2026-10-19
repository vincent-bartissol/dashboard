"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DemoEmailPreview } from "@/components/demo/demo-email-preview";
import {
  ARRONDISSEMENTS,
  formatDistrictOrdinal,
} from "@/lib/opendata/arrondissement";
import type { AppLocale } from "@/i18n/routing";
import { PROFILE_NAME_MAX } from "@/lib/profile-name";
import { formString } from "@/lib/safe-string";
import { applyChangeEmailDemo, requestChangeEmailDemo, updateDemoProfile } from "@/lib/demo/store";
import { changeEmailMail } from "@/lib/email/templates";
import { useNotify } from "@/components/dashboard/notifications";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function ProfileForm({
  firstName,
  lastName,
  email,
  emailVerified,
  arrondissement,
}: Readonly<{
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  arrondissement: string | null;
}>) {
  const t = useTranslations("Profile");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const notify = useNotify();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [district, setDistrict] = useState(arrondissement ?? "");
  const [emailPending, setEmailPending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailPreview, setEmailPreview] = useState<string | null>(null);

  useEffect(() => {
    setDistrict(arrondissement ?? "");
  }, [arrondissement]);

  function onChangeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newEmail = formString(form, "email").trim();
    setEmailError(null);
    if (newEmail === email) {
      setEmailError(t("emailSame"));
      return;
    }
    setEmailPending(true);
    requestChangeEmailDemo(newEmail);
    setEmailPreview(newEmail);
    setEmailPending(false);
    notify({ tone: "status", message: t("emailSent") });
  }

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(() => {
      const result = updateDemoProfile({
        firstName: formString(form, "firstName"),
        lastName: formString(form, "lastName"),
        arrondissement: district || null,
      });
      if (!result.ok) {
        setError(t("genericError"));
        return;
      }
      notify({ tone: "status", message: t("saved") });
      router.refresh();
    });
  }

  if (emailPreview) {
    const mail = changeEmailMail(
      `https://vvbb.fr/dashboard/${locale}/dashboard/profile/`,
      emailPreview,
      locale,
    );
    return (
      <DemoEmailPreview
        mail={mail}
        onOpen={() => {
          applyChangeEmailDemo();
          setEmailPreview(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSave} className="space-y-4">
        <div>
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={firstName}
            required
            maxLength={PROFILE_NAME_MAX}
            autoComplete="given-name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={lastName}
            required
            maxLength={PROFILE_NAME_MAX}
            autoComplete="family-name"
          />
        </div>
        <div>
          <Label htmlFor="arrondissement">{t("district")}</Label>
          <Select
            id="arrondissement"
            name="arrondissement"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
          >
            <option value="">{t("allParis")}</option>
            {ARRONDISSEMENTS.map((item) => (
              <option key={item.code} value={item.code}>
                {formatDistrictOrdinal(item.code, locale)}
              </option>
            ))}
            <option value="montreuil">{t("montreuil")}</option>
          </Select>
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
      </form>

      <form onSubmit={onChangeEmail} className="space-y-4 border-t border-line pt-6">
        <p className="text-sm text-muted">
          {emailVerified ? t("emailVerified") : t("emailPending")} · {email}
        </p>
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" defaultValue={email} required />
        </div>
        {emailError ? <p role="alert" className="text-sm text-danger">{emailError}</p> : null}
        <Button type="submit" variant="secondary" disabled={emailPending}>
          {emailPending ? t("saving") : t("changeEmail")}
        </Button>
      </form>
    </div>
  );
}
