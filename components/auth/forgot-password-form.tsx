"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DemoEmailPreview } from "@/components/demo/demo-email-preview";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { requestResetDemo } from "@/lib/demo/store";
import { resetPasswordMail } from "@/lib/email/templates";
import { formString } from "@/lib/safe-string";
import type { AppLocale } from "@/i18n/routing";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = formString(new FormData(event.currentTarget), "email").trim();
    requestResetDemo(value);
    setEmail(value);
  }

  if (email) {
    const mail = resetPasswordMail(
      `https://vvbb.fr/dashboard/${locale}/reset-password/?token=demo`,
      locale,
    );
    return (
      <DemoEmailPreview
        mail={mail}
        onOpen={() => router.push("/reset-password?token=demo")}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Button type="submit" className="w-full">
        {t("sendLink")}
      </Button>
    </form>
  );
}
