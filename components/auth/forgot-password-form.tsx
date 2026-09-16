"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { withLocale } from "@/i18n/path";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setError(null);
    setSent(false);
    setPending(true);
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: withLocale("/reset-password", locale),
    });
    setPending(false);
    if (result.error) {
      setError(t("genericError"));
      return;
    }
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {sent ? <p className="text-sm text-muted">{t("forgotSent")}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("pending") : t("sendLink")}
      </Button>
    </form>
  );
}
