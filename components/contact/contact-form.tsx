"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { formString } from "@/lib/safe-string";
import { CONTACT_EMAIL_MAX, CONTACT_MESSAGE_MAX, CONTACT_NAME_MAX } from "@/lib/contact";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function ContactForm() {
  const t = useTranslations("Contact");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void formString(form, "name");
    void formString(form, "email");
    void formString(form, "message");
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setPending(false);
    setSent(true);
  }

  if (sent) {
    return <p className="text-sm text-muted">{t("success")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          maxLength={CONTACT_NAME_MAX}
          autoComplete="name"
        />
      </div>
      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          maxLength={CONTACT_EMAIL_MAX}
          autoComplete="email"
        />
      </div>
      <div className="hidden" aria-hidden>
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <Label htmlFor="message">{t("message")}</Label>
        <Textarea id="message" name="message" required maxLength={CONTACT_MESSAGE_MAX} rows={5} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("pending") : t("submit")}
      </Button>
    </form>
  );
}
