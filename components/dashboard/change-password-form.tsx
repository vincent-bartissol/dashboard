"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/components/dashboard/notifications";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { formString } from "@/lib/safe-string";
import { SectionTitle } from "@/components/ui/heading";

export function ChangePasswordForm() {
  const t = useTranslations("Profile");
  const notify = useNotify();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = formString(form, "currentPassword");
    const next = formString(form, "newPassword");
    const confirm = formString(form, "confirmPassword");
    setError(null);
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(t("passwordTooShort"));
      return;
    }
    if (next.length > MAX_PASSWORD_LENGTH) {
      setError(t("passwordTooLong"));
      return;
    }
    if (next !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    if (next === current) {
      setError(t("passwordSame"));
      return;
    }
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      event.currentTarget.reset();
      notify({ tone: "status", message: t("passwordUpdated") });
    }, 200);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <SectionTitle>{t("passwordTitle")}</SectionTitle>
      <p className="text-sm text-muted">{t("passwordHint")}</p>
      <div>
        <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <div>
        <Label htmlFor="newPassword">{t("newPassword")}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          autoComplete="new-password"
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          autoComplete="new-password"
        />
      </div>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("saving") : t("changePassword")}
      </Button>
    </form>
  );
}
